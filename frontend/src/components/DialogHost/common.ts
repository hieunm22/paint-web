import type { DragBase, Point, Viewport } from "./types"

const EDGE_GAP = 4

/** how much of the dialog must stay on screen to remain grabbable. */
const MIN_VISIBLE = 28

function clamp(value: number, min: number, max: number): number {
	return max < min ? min : Math.min(Math.max(value, min), max)
}

/**
 * keeps a dragged dialog reachable: it may hang off the left or right edge, but
 * never far enough that the title bar leaves the viewport.
 */
export function clampDragOffset(
	offset: Point,
	base: DragBase,
	viewport: Viewport,
): Point {
	const left = clamp(
		base.left + offset.x,
		EDGE_GAP - base.width + MIN_VISIBLE,
		viewport.width - MIN_VISIBLE,
	)
	const top = clamp(
		base.top + offset.y,
		EDGE_GAP,
		viewport.height - MIN_VISIBLE,
	)

	return { x: left - base.left, y: top - base.top }
}
