import type { Point } from "types/store.types"

const ORIGIN: Point = { x: 0, y: 0 }

let visible: Point = ORIGIN

/**
 * the top-left image pixel currently in view. the canvas writes it straight on
 * scroll rather than through a slice: a scroll fires as thickly as a pointer
 * move, and dispatching one per event would re-render the whole app.
 */
export function reportVisibleOrigin(pt: Point): void {
	visible = pt
}

/** where a paste lands, which is the corner the user is looking at. */
export function visibleOrigin(): Point {
	return visible
}
