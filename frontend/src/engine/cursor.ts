import type { Point } from "store/types"

const PUBLISH_MS = 60

type Listener = () => void

const listeners = new Set<Listener>()
let pending: Point | null = null
let published: Point | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function publish(): void {
	timer = null
	if (published === pending) return

	published = pending
	for (const listener of listeners) listener()
}

/**
 * pointer position in image pixels, held outside redux; a move never dispatches.
 * published on the leading edge and then at most once per interval.
 */
export function reportCursor(next: Point | null): void {
	pending = next
	if (timer !== null) return

	publish()
	timer = setTimeout(publish, PUBLISH_MS)
}

export function subscribeCursor(listener: Listener): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

/** the reference stays stable between publishes, as useSyncExternalStore needs. */
export function getCursor(): Point | null {
	return published
}
