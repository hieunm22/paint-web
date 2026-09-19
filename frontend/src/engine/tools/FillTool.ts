import type { Point } from "store/types"
import { hexToRgba } from "../color"
import { contains } from "../geometry"
import type { Modifiers, Tool, ToolContext } from "../types"
import { floodFill } from "../raster"

/** flood fill with zero tolerance: Paint matches colours exactly. */
export class FillTool implements Tool {
	readonly id = "fill"
	readonly label = "Fill with colour"

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		if (!contains(ctx.doc, pt)) return

		const { width, height } = ctx.doc
		const img = ctx.surface.readRegion({ x: 0, y: 0, w: width, h: height })
		if (!img) return

		const color = hexToRgba(mods.secondary ? ctx.color2 : ctx.color1)
		const dirty = floodFill(img, pt, color)
		if (!dirty) return

		ctx.markDirty(dirty)
		// only the filled box goes back, not the whole document
		ctx.base.putImageData(img, 0, 0, dirty.x, dirty.y, dirty.w, dirty.h)
	}
}
