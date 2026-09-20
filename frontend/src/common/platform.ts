import { IS_MAC } from "common/constant"

/** the button that paints with colour 2 instead of colour 1. */
export function isSecondaryButton(button: number, ctrlKey: boolean): boolean {
	return button === 2 || (IS_MAC && ctrlKey && button === 0)
}

/** Cmd on macOS, Ctrl elsewhere, for the shortcuts Paint shares with the OS. */
export function isPrimaryModifier(event: KeyboardEvent): boolean {
	return IS_MAC ? event.metaKey : event.ctrlKey
}
