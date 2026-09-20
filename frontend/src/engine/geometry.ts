import { BOX_HANDLE_SPOTS, GRIP_REACH } from "common/constant"
import type { Size } from "types/engine.types"
import type { Point, Rect } from "types/store.types"

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

/** the box two drag points span, with the corners in any order. */
export function rectFromPoints(a: Point, b: Point): Rect {
	return {
		x: Math.min(a.x, b.x),
		y: Math.min(a.y, b.y),
		w: Math.abs(b.x - a.x),
		h: Math.abs(b.y - a.y),
	}
}

/** Shift on a box shape: the longer side wins and the drag keeps its way. */
export function squareFromPoints(a: Point, b: Point): Point {
	const side = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y))
	return {
		x: a.x + Math.sign(b.x - a.x || 1) * side,
		y: a.y + Math.sign(b.y - a.y || 1) * side,
	}
}

export function clampPoint(pt: Point, doc: Size): Point {
	return {
		x: Math.min(Math.max(pt.x, 0), doc.width),
		y: Math.min(Math.max(pt.y, 0), doc.height),
	}
}

export function insideRect(rect: Rect, pt: Point): boolean {
	return (
		pt.x >= rect.x &&
		pt.y >= rect.y &&
		pt.x <= rect.x + rect.w &&
		pt.y <= rect.y + rect.h
	)
}

/** the box holding both, which is what one undo step of a move has to cover. */
export function rectUnion(a: Rect, b: Rect): Rect {
	const x = Math.min(a.x, b.x)
	const y = Math.min(a.y, b.y)
	return {
		x,
		y,
		w: Math.max(a.x + a.w, b.x + b.w) - x,
		h: Math.max(a.y + a.h, b.y + b.h) - y,
	}
}

/** grows a box by `by` on every side, for a stroke drawn on its outline. */
export function inflateRect(rect: Rect, by: number): Rect {
	return {
		x: rect.x - by,
		y: rect.y - by,
		w: rect.w + by * 2,
		h: rect.h + by * 2,
	}
}

/** box around a run of points, which is what a polygon or a curve needs. */
export function boundsOfPoints(points: Point[]): Rect | null {
	if (!points.length) return null

	let minX = points[0].x
	let maxX = points[0].x
	let minY = points[0].y
	let maxY = points[0].y
	for (const { x, y } of points) {
		if (x < minX) minX = x
		if (x > maxX) maxX = x
		if (y < minY) minY = y
		if (y > maxY) maxY = y
	}

	return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
}

/** the eight grab points of a box: four corners, then the edge midpoints. */
export function boxHandles(rect: Rect): Point[] {
	return BOX_HANDLE_SPOTS.map(spot => ({
		x: rect.x + spot.x * rect.w,
		y: rect.y + spot.y * rect.h,
	}))
}

/** which handle the pointer grabbed, or -1. the reach follows the zoom. */
export function nearestGrip(handles: Point[], pt: Point, zoom: number): number {
	const reach = Math.max(2, GRIP_REACH / zoom)

	return handles.findIndex(
		handle =>
			Math.abs(handle.x - pt.x) <= reach && Math.abs(handle.y - pt.y) <= reach,
	)
}

/** drags one of the eight handles, leaving the opposite side of the box put. */
export function resizeBox(rect: Rect, grip: number, at: Point): Rect {
	const spot = BOX_HANDLE_SPOTS[grip]
	let left = rect.x
	let right = rect.x + rect.w
	let top = rect.y
	let bottom = rect.y + rect.h

	if (spot.x === 0) left = at.x
	else if (spot.x === 1) right = at.x
	if (spot.y === 0) top = at.y
	else if (spot.y === 1) bottom = at.y

	return rectFromPoints({ x: left, y: top }, { x: right, y: bottom })
}

/** moves points from one box into another, which is how a handle resizes. */
export function remapPoints(points: Point[], from: Rect, to: Rect): Point[] {
	const sx = from.w ? to.w / from.w : 1
	const sy = from.h ? to.h / from.h : 1

	return points.map(({ x, y }) => ({
		x: to.x + (x - from.x) * sx,
		y: to.y + (y - from.y) * sy,
	}))
}
