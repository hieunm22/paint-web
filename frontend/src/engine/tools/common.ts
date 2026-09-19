import type { Point } from "store/types"
import type { ToolContext } from "../types"
import { clampRect, segmentBounds } from "../geometry"
import { bresenham } from "../raster"

/**
 * hard-edged segment painted into preview with a square brush. fillRect on
 * whole pixels keeps the edges sharp, which is what Paint draws.
 */
export function stampSegment(
	ctx: ToolContext,
	a: Point,
	b: Point,
	color: string,
): void {
	const dirty = clampRect(segmentBounds(a, b, ctx.size), ctx.doc)
	if (!dirty) return

	ctx.markDirty(dirty)
	const off = Math.floor(ctx.size / 2)
	ctx.preview.fillStyle = color
	bresenham(a, b, (x, y) =>
		ctx.preview.fillRect(x - off, y - off, ctx.size, ctx.size),
	)
}
