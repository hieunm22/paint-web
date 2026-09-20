import { MAX_DIMENSION, MAX_SKEW } from "common/constant"
import type {
	DragBase,
	Point,
	ResizeUnit,
	Viewport,
} from "./types"

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

/** what the field on one axis reads for a size left as it is. */
export function wholeOf(unit: ResizeUnit, side: number): number {
	return unit === "percent" ? 100 : side
}

/** the factor a field asks for, whichever unit it is written in. */
export function scaleOf(unit: ResizeUnit, value: number, side: number): number {
	return unit === "percent" ? value / 100 : side ? value / side : 1
}

/**
 * the other field under a locked aspect ratio. percentages simply match; a
 * pixel count follows the side it is tied to.
 */
export function linkedValue(
	unit: ResizeUnit,
	value: number,
	from: number,
	to: number,
): number {
	if (unit === "percent") return value

	return from ? Math.max(1, Math.round((value * to) / from)) : value
}

/** a shear stops short of 90 degrees, where the matrix loses its inverse. */
export function clampSkew(value: number): number {
	return clamp(value, -MAX_SKEW, MAX_SKEW)
}

/**
 * keeps a resize inside what the app will open again. a factor of zero or less
 * has no picture in it, and the cap is the same one the open path enforces.
 */
export function clampScale(scale: number, side: number): number {
	if (!(scale > 0) || !side) return 1

	return Math.min(scale, MAX_DIMENSION / side)
}
