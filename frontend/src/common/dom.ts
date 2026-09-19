const EDITABLE = ["INPUT", "TEXTAREA", "SELECT"]

/** true while the event landed in a field the user is typing into. */
export function isTypingTarget(target: EventTarget | null): boolean {
	const el = target as HTMLElement | null
	if (!el) return false

	return EDITABLE.includes(el.tagName) || el.isContentEditable
}
