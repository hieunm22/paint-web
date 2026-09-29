import {
	IS_MAC,
	MAC_KEY_LABELS,
	MAC_MODIFIER_ORDER,
	MAC_SHORTCUT_OVERRIDES,
	SHORTCUT_JOIN,
	SPELL_OUT_FROM,
	WINDOWS_KEY_LABELS,
	WINDOWS_SHORTCUT_OVERRIDES,
} from "common/constant"

/** the button that paints with color 2 instead of color 1. */
export function isSecondaryButton(button: number, ctrlKey: boolean): boolean {
	return button === 2 || (IS_MAC && ctrlKey && button === 0)
}

/** Cmd on macOS, Ctrl elsewhere, for the shortcuts Paint shares with the OS. */
export function isPrimaryModifier(event: KeyboardEvent): boolean {
	return IS_MAC ? event.metaKey : event.ctrlKey
}

/** macOS writes modifiers in a fixed order, whichever order they came in. */
function macOrder(parts: string[]): string[] {
	const key = parts[parts.length - 1]
	const modifiers = parts
		.slice(0, -1)
		.sort(
			(a, b) => MAC_MODIFIER_ORDER.indexOf(a) - MAC_MODIFIER_ORDER.indexOf(b),
		)

	return [...modifiers, key]
}

export function formatShortcut(shortcut: string): string {
	const overrides = IS_MAC ? MAC_SHORTCUT_OVERRIDES : WINDOWS_SHORTCUT_OVERRIDES
	const parts = (overrides[shortcut] ?? shortcut).split("+")
	const ordered = IS_MAC ? macOrder(parts) : parts
	const table = IS_MAC ? MAC_KEY_LABELS : WINDOWS_KEY_LABELS
	const spelled = ordered.map(part => table[part] ?? part).join(SHORTCUT_JOIN)
	if (spelled.split(SHORTCUT_JOIN).length >= SPELL_OUT_FROM) return spelled

	return spelled.split(SHORTCUT_JOIN).join(IS_MAC ? "" : "+")
}

export function isReservedCtrlKey(e: KeyboardEvent, key: string): boolean {
	if (e.key.toLowerCase() !== key) return false
	if (IS_MAC) return e.ctrlKey && !e.metaKey && !e.altKey

	return e.ctrlKey && e.altKey
}

/** the zoom keys, which take Alt on windows where Ctrl+PageUp changes tab. */
export function isZoomKey(e: KeyboardEvent): boolean {
	if (e.key !== "PageUp" && e.key !== "PageDown") return false

	return isPrimaryModifier(e) && (IS_MAC || e.altKey)
}

/** F11, and Cmd+Shift+F on macOS, where F11 belongs to Mission Control. */
export function isFullScreenKey(e: KeyboardEvent): boolean {
	if (e.key === "F11") return true

	return IS_MAC && e.metaKey && e.shiftKey && e.key.toLowerCase() === "f"
}
