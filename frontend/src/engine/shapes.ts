import { SHAPE_DEFS } from "common/constant"
import type { ShapeSubpath } from "types/engine.types"
import type { Point, Rect, ShapeKind } from "types/store.types"

function at(x: number, y: number): Point {
	return { x, y }
}

/** unit-box point placed in the drag box. */
function place(p: Point, rect: Rect): Point {
	return at(rect.x + p.x * rect.w, rect.y + p.y * rect.h)
}

function addSubpath(path: Path2D, subpath: ShapeSubpath, rect: Rect): void {
	const start = place(subpath.start, rect)
	path.moveTo(start.x, start.y)

	for (const segment of subpath.segments) {
		const to = place(segment.to, rect)
		if (!segment.c1 || !segment.c2) {
			path.lineTo(to.x, to.y)
			continue
		}

		const c1 = place(segment.c1, rect)
		const c2 = place(segment.c2, rect)
		path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y)
	}

	if (subpath.closed) path.closePath()
}

/** the shape scaled into `rect`, or null for one that follows drawn points. */
export function buildShapePath(kind: ShapeKind, rect: Rect): Path2D | null {
	const { outline } = SHAPE_DEFS[kind]
	if (!outline) return null

	const path = new Path2D()
	for (const subpath of outline) addSubpath(path, subpath, rect)
	return path
}

/**
 * the line and its bends: no control point draws a straight line, one draws a
 * quadratic and two a cubic, which is how Paint's curve grows.
 */
export function buildCurvePath(
	from: Point,
	to: Point,
	controls: Point[],
): Path2D {
	const path = new Path2D()
	path.moveTo(from.x, from.y)

	if (controls.length === 0) path.lineTo(to.x, to.y)
	else if (controls.length === 1) {
		path.quadraticCurveTo(controls[0].x, controls[0].y, to.x, to.y)
	} else {
		path.bezierCurveTo(
			controls[0].x,
			controls[0].y,
			controls[1].x,
			controls[1].y,
			to.x,
			to.y,
		)
	}

	return path
}

export function buildPolygonPath(points: Point[], closed: boolean): Path2D {
	const path = new Path2D()
	if (!points.length) return path

	path.moveTo(points[0].x, points[0].y)
	for (const point of points.slice(1)) path.lineTo(point.x, point.y)
	if (closed) path.closePath()
	return path
}
