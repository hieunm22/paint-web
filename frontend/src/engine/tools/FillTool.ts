import type { Point, Rect } from "store/types"
import type { Modifiers, RGBA, Tool, ToolContext } from "../types"
import { hexToRgba } from "../color"
import { floodFillOffThread } from "../fillWorker"
import { contains } from "../geometry"
import { floodFill } from "../raster"
import { drawCursor, FILL_CURSOR } from "./cursorArt"

/**
 * above this the fill goes to a worker. four megapixels is about 200 ms of
 * scanline work, which is far past a frame and would freeze the interface.
 */
const OFF_THREAD_PIXELS = 4_000_000

/** flood fill with zero tolerance: Paint matches colours exactly. */
export class FillTool implements Tool {
	readonly id = "fill"
	readonly label = "Fill with colour"

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		if (!contains(ctx.doc, pt)) return

		const { width, height } = ctx.doc
		const image = ctx.surface.readRegion({ x: 0, y: 0, w: width, h: height })
		if (!image) return

		const color = hexToRgba(mods.secondary ? ctx.color2 : ctx.color1)
		if (width * height <= OFF_THREAD_PIXELS) {
			write(ctx, image, floodFill(image, pt, color))
			return
		}

		ctx.defer(this.label, this.offThread(image, pt, color, ctx))
	}

	/** falls back to the main thread rather than leaving the click unanswered. */
	private async offThread(
		image: ImageData,
		seed: Point,
		color: RGBA,
		ctx: ToolContext,
	): Promise<void> {
		try {
			const filled = await floodFillOffThread(image, seed, color)
			write(ctx, filled.image, filled.dirty)
		} catch {
			const retry = ctx.surface.readRegion({
				x: 0,
				y: 0,
				w: ctx.doc.width,
				h: ctx.doc.height,
			})
			if (retry) write(ctx, retry, floodFill(retry, seed, color))
		}
	}

	paintOverlay(screen: Point, ctx: ToolContext): void {
		drawCursor(ctx.overlay, FILL_CURSOR, screen)
	}
}

/** snapshot first, then put back only the box that changed. */
function write(ctx: ToolContext, image: ImageData, dirty: Rect | null): void {
	if (!dirty) return

	ctx.markDirty(dirty)
	ctx.base.putImageData(image, 0, 0, dirty.x, dirty.y, dirty.w, dirty.h)
}
