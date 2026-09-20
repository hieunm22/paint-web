import type { OverlayShape, OverlayState } from "types/engine.types"
import type { Point, Rect } from "types/store.types"

const PUBLISH_MS = 40

const EMPTY: OverlayState = { selection: null, lasso: null, draft: null }

type Listener = () => void

const listeners = new Set<Listener>()
let pending: OverlayState = EMPTY
let published: OverlayState = EMPTY
let timer: ReturnType<typeof setTimeout> | null = null

function sameRect(a: Rect | null, b: Rect | null): boolean {
	if (!a || !b) return a === b

	return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

function samePoints(a: Point[] | null, b: Point[] | null): boolean {
	if (!a || !b) return a === b

	return (
		a.length === b.length &&
		a.every((one, i) => one.x === b[i].x && one.y === b[i].y)
	)
}

function sameDraft(a: OverlayShape | null, b: OverlayShape | null): boolean {
	if (!a || !b) return a === b

	return sameRect(a.bounds, b.bounds) && samePoints(a.handles, b.handles)
}

function publish(): void {
	timer = null
	if (
		sameRect(published.selection, pending.selection) &&
		samePoints(published.lasso, pending.lasso) &&
		sameDraft(published.draft, pending.draft)
	) {
		return
	}

	published = pending
	for (const listener of listeners) listener()
}

/**
 * what the canvas draws over the picture: marching ants and the handles of an
 * unfinished shape. a drag updates it without going through redux.
 */
function report(next: OverlayState): void {
	pending = next
	if (timer !== null) return

	publish()
	timer = setTimeout(publish, PUBLISH_MS)
}

/** `lasso` traces a free-form selection; a box selection passes null. */
export function reportSelectionBox(
	rect: Rect | null,
	lasso: Point[] | null = null,
): void {
	report({ selection: rect, lasso, draft: pending.draft })
}

export function reportDraft(draft: OverlayShape | null): void {
	report({ selection: pending.selection, lasso: pending.lasso, draft })
}

export function clearOverlayState(): void {
	report(EMPTY)
}

export function subscribeOverlay(listener: Listener): () => void {
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
	}
}

/** the reference stays stable between publishes, as useSyncExternalStore needs. */
export function getOverlayState(): OverlayState {
	return published
}
