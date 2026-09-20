import { hexToRgba } from "engine/color"
import { clampRect, constrainToAxis, segmentBounds } from "engine/geometry"
import { bresenham, stampReplace } from "engine/raster"
import { stampSegment } from "engine/tools/common"
import { drawSquareCursor } from "engine/tools/cursorArt"
import { translate } from "locales/translate"
import type { Modifiers, Tool, ToolContext } from "types/engine.types"
import type { Point } from "types/store.types"

const ORIGIN: Point = { x: 0, y: 0 }

/**
 * erasing in Paint paints colour 2, it does not cut a hole. the right button
 * turns it into a colour replacer that only repaints pixels holding colour 1.
 */
export class EraserTool implements Tool {
	readonly id = "eraser"

	get label(): string {
		return translate("history.label.eraser")
	}
	private origin: Point = ORIGIN
	private last: Point = ORIGIN

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		this.origin = pt
		this.last = pt
		this.paint(pt, pt, mods, ctx)
	}

	update(pts: Point[], mods: Modifiers, ctx: ToolContext): void {
		for (const raw of pts) {
			const pt = mods.shift ? constrainToAxis(this.origin, raw) : raw
			this.paint(this.last, pt, mods, ctx)
			this.last = pt
		}
	}

	private paint(a: Point, b: Point, mods: Modifiers, ctx: ToolContext): void {
		if (!mods.secondary) {
			stampSegment(ctx, a, b, ctx.color2)
			return
		}

		const dirty = clampRect(segmentBounds(a, b, ctx.size), ctx.doc)
		if (!dirty) return

		// the replacer reads committed pixels, which puts it on base rather
		// than preview; the snapshot has to come first
		ctx.markDirty(dirty)
		const region = ctx.surface.readRegion(dirty)
		if (!region) return

		const from = hexToRgba(ctx.color1)
		const to = hexToRgba(ctx.color2)
		bresenham(a, b, (x, y) =>
			stampReplace(region, dirty, { x, y }, ctx.size, from, to),
		)
		ctx.surface.writeRegion(region, dirty.x, dirty.y)
	}

	/** the square is the footprint, so it follows both size and zoom. */
	paintOverlay(screen: Point, ctx: ToolContext): void {
		drawSquareCursor(ctx.overlay, screen, Math.max(1, ctx.size * ctx.zoom))
	}
}
