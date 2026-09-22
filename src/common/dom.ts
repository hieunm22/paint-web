const EDITABLE = ["INPUT", "TEXTAREA", "SELECT"]

/** the web's answer to Maximize: the tab itself goes full screen. */
export function toggleFullscreen(): void {
	if (document.fullscreenElement) void document.exitFullscreen()
	else void document.documentElement.requestFullscreen()
}

/** true while the event landed in a field the user is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
	const el = target as HTMLElement | null
	if (!el) return false

	return EDITABLE.includes(el.tagName) || el.isContentEditable
}

/**
 * the keys a field does not get to swallow. Esc always reaches the canvas;
 * Enter does too, except inside a text box, where it opens the next line.
 */
export function reachesCanvas(e: KeyboardEvent): boolean {
	if (e.key === "Escape") return true

	const el = e.target as HTMLElement | null
	return e.key === "Enter" && el?.tagName !== "TEXTAREA"
}
