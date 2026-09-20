import { translate } from "locales/translate"
import type { EmptyVoid } from "types/common.types"
import type { TranslateParams } from "types/locales.types"

const listeners = new Set<EmptyVoid>()
let message = ""

/**
 * what a screen reader is told after an operation the picture cannot show by
 * itself. the text is built here: a live region reads a string, not a key.
 */
export function announce(key: string, params?: TranslateParams): void {
	const next = translate(key, params)
	if (next === message) return

	message = next
	for (const listener of listeners) listener()
}

export function subscribeAnnouncement(listener: EmptyVoid): EmptyVoid {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

/** the reference stays stable between announcements, as react needs it to. */
export function getAnnouncement(): string {
	return message
}
