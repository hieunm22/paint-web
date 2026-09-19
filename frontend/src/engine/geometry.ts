import type { Point, Rect } from "store/types"
import type { Size } from "./types"

/** bounding box of a segment stamped with a square brush of `size`. */
export function segmentBounds(a: Point, b: Point, size: number): Rect {
	const off = Math.floor(size / 2)
	const x = Math.min(a.x, b.x) - off
	const y = Math.min(a.y, b.y) - off

	return {
		x,
		y,
		w: Math.abs(a.x - b.x) + size,
		h: Math.abs(a.y - b.y) + size,
	}
}

/** the part of `rect` that lies on the document, or null when none of it does. */
export function clampRect(rect: Rect, doc: Size): Rect | null {
	const x = Math.max(0, Math.floor(rect.x))
	const y = Math.max(0, Math.floor(rect.y))
	const right = Math.min(doc.width, Math.ceil(rect.x + rect.w))
	const bottom = Math.min(doc.height, Math.ceil(rect.y + rect.h))
	if (right <= x || bottom <= y) return null

	return { x, y, w: right - x, h: bottom - y }
}

export function contains(doc: Size, pt: Point): boolean {
	return pt.x >= 0 && pt.y >= 0 && pt.x < doc.width && pt.y < doc.height
}

/**
 * Shift locks a stroke to the horizontal, the vertical or a 45 degree
 * diagonal, whichever the free end is closest to.
 */
export function constrainToAxis(from: Point, to: Point): Point {
	const dx = to.x - from.x
	const dy = to.y - from.y
	const ax = Math.abs(dx)
	const ay = Math.abs(dy)

	if (ax > ay * 2) return { x: to.x, y: from.y }
	if (ay > ax * 2) return { x: from.x, y: to.y }

	const step = Math.round((ax + ay) / 2)
	return {
		x: from.x + Math.sign(dx) * step,
		y: from.y + Math.sign(dy) * step,
	}
}
