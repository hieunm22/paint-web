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

/**
 * prints a canonical shortcut the way the running platform marks its keys.
 * one or two keys run together, as "Ctrl+S" or a glyph pair, and three or more
 * are spaced out so nobody has to pick the combination apart.
 */
export function formatShortcut(shortcut: string): string {
	const overrides = IS_MAC ? MAC_SHORTCUT_OVERRIDES : WINDOWS_SHORTCUT_OVERRIDES
	const parts = (overrides[shortcut] ?? shortcut).split("+")
	const ordered = IS_MAC ? macOrder(parts) : parts
	const table = IS_MAC ? MAC_KEY_LABELS : WINDOWS_KEY_LABELS
	const spelled = ordered.map(part => table[part] ?? part).join(SHORTCUT_JOIN)
	if (spelled.split(SHORTCUT_JOIN).length >= SPELL_OUT_FROM) return spelled

	return spelled.split(SHORTCUT_JOIN).join(IS_MAC ? "" : "+")
}

/** the key standing in for New, which no browser lets the page have. */
export function isNewDocumentKey(event: KeyboardEvent): boolean {
	if (event.key.toLowerCase() !== "n") return false
	if (IS_MAC) return event.ctrlKey && !event.metaKey && !event.altKey

	return event.ctrlKey && event.altKey
}
