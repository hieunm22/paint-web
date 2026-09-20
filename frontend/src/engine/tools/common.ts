import { clampRect, segmentBounds } from "engine/geometry"
import { bresenham } from "engine/raster"
import type { ToolContext } from "types/engine.types"
import type { Point } from "types/store.types"

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
