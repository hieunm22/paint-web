/** Ctrl+click is the right button on macOS, and Cmd carries the shortcuts. */
export const IS_MAC = /Mac|iPhone|iPad/.test(navigator.userAgent)

/** the button that paints with colour 2 instead of colour 1. */
export function isSecondaryButton(button: number, ctrlKey: boolean): boolean {
	return button === 2 || (IS_MAC && ctrlKey && button === 0)
}

/** Cmd on macOS, Ctrl elsewhere, for the shortcuts Paint shares with the OS. */
export function isPrimaryModifier(event: KeyboardEvent): boolean {
	return IS_MAC ? event.metaKey : event.ctrlKey
}
