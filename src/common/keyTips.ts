import { KEYTIP_INSET, KEYTIP_POOL, KEYTIP_WIDE_RATIO } from "common/constant"
import type {
	KeyTipBase,
	KeyTipBox,
	KeyTipCandidate,
	KeyTipLayer,
	KeyTipSpot,
	KeyTipTarget,
} from "types/common.types"

const LAYER_SELECTOR = "[data-keytip-layer]"
const MENU_SELECTOR = '[data-keytip-layer="menu"]'

/** a label cut down to the plain letters and digits a tip may be drawn from. */
export function keyTipLetters(label: string): string {
	return label
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[\u0110\u0111]/g, "D")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
}

/** two tips clash when one is typed on the way to the other. */
function clashes(a: string, b: string): boolean {
	return a.startsWith(b) || b.startsWith(a)
}

/**
 * a control without a tip of its own takes the first letter of its label still
 * free, then one from the pool. a disabled control gets none.
 */
export function assignKeyTips(
	candidates: KeyTipCandidate[],
): (string | null)[] {
	const taken = candidates.flatMap(c => (c.keys ? [c.keys] : []))

	return candidates.map(c => {
		if (c.keys) return c.keys
		if (c.disabled) return null

		const letters = keyTipLetters(c.label)
		const pool = [...letters, ...KEYTIP_POOL]
		const free = pool.find(ch => !taken.some(key => clashes(key, ch)))
		if (!free) return null

		taken.push(free)
		return free
	})
}

/** the tips still in reach once `typed` has been pressed. */
export function keyTipsFor(
	targets: KeyTipTarget[],
	typed: string,
): KeyTipTarget[] {
	return targets.filter(target => target.keys.startsWith(typed))
}

/** what a key press adds to a tip, or null for a key no tip is made of. */
export function keyTipChar(
	e: Pick<KeyboardEvent, "key" | "code">,
): string | null {
	if (/^[a-z0-9]$/i.test(e.key)) return e.key.toUpperCase()

	// a layout without latin letters still names the physical key
	const code = /^(?:Key|Digit|Numpad)([A-Z0-9])$/.exec(e.code)
	return code ? code[1] : null
}

/**
 * large ribbon buttons carry their tip on the bottom edge, and a row of small
 * ones on the edge facing out of the ribbon. menus center it on the row.
 */
function keyTipTop(
	layer: KeyTipLayer,
	box: KeyTipBox,
	frame: KeyTipBox,
): number {
	const middle = (box.top + box.bottom) / 2
	if (layer === "root") return box.bottom
	if (layer === "menu") return middle

	const frameHeight = frame.bottom - frame.top
	const third = frameHeight / 3
	const tall = (box.bottom - box.top) * 2 > frameHeight
	if (tall || middle > frame.bottom - third) return box.bottom
	if (middle < frame.top + third) return box.top
	return middle
}

/** where a tip stands over its control; `frame` is the layer holding it. */
export function placeKeyTip(
	layer: KeyTipLayer,
	box: KeyTipBox,
	frame: KeyTipBox,
): KeyTipSpot {
	const width = box.right - box.left
	const height = box.bottom - box.top
	const wide = layer !== "root" && width >= height * KEYTIP_WIDE_RATIO
	const left = wide ? box.left + KEYTIP_INSET : (box.left + box.right) / 2

	return { left, top: keyTipTop(layer, box, frame) }
}

/** the menu drawn last, which is the one standing on top. */
export function topKeyTipMenu(): HTMLElement | null {
	const menus = document.querySelectorAll<HTMLElement>(MENU_SELECTOR)
	return menus.length ? menus[menus.length - 1] : null
}

function labelOf(el: HTMLElement): string {
	return el.getAttribute("aria-label") || el.textContent || ""
}

/** a layer marked data-keytip-auto hands every button a tip, not just marked ones. */
function collectIn(layer: KeyTipLayer, root: HTMLElement): KeyTipTarget[] {
	const selector = root.hasAttribute("data-keytip-auto")
		? "[data-keytip], button"
		: "[data-keytip]"
	const controls = [...root.querySelectorAll<HTMLElement>(selector)].filter(
		el => el.closest(LAYER_SELECTOR) === root && el.getClientRects().length,
	)
	const candidates = controls.map(el => ({
		keys: el.dataset.keytip || null,
		label: labelOf(el),
		disabled: el.matches(":disabled"),
	}))
	const keys = assignKeyTips(candidates)
	const frame = root.getBoundingClientRect()

	return controls.flatMap((el, i) => {
		const tip = keys[i]
		if (!tip) return []

		const box = el.getBoundingClientRect()
		const spot = placeKeyTip(layer, box, frame)
		return [{ el, keys: tip, disabled: candidates[i].disabled, ...spot }]
	})
}

/** an open menu wins over the ribbon under it. */
export function currentKeyTips(base: KeyTipBase): KeyTipTarget[] {
	const menu = topKeyTipMenu()
	if (menu) return collectIn("menu", menu)

	const roots = document.querySelectorAll<HTMLElement>(
		`[data-keytip-layer="${base}"]`,
	)
	return [...roots].flatMap(root => collectIn(base, root))
}

/** a box that takes typing gets the focus and answers false; anything else is clicked. */
export function pressKeyTip(el: HTMLElement): boolean {
	if (el.matches("select, input, textarea")) {
		el.focus()
		return false
	}

	el.click()
	return true
}
