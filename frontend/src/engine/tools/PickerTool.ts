import { pickerPicked } from "store/actions"
import type { Point } from "store/types"
import type { Modifiers, Tool, ToolContext } from "../types"
import { rgbaToHex } from "../color"
import { contains } from "../geometry"
import { drawCursor, PICKER_CURSOR } from "./cursorArt"

/**
 * reads one committed pixel into a swatch and hands the previous tool back.
 * nothing is drawn, so this tool never pushes a history step.
 */
export class PickerTool implements Tool {
	readonly id = "picker"
	readonly label = "Pick colour"

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		if (!contains(ctx.doc, pt)) return

		const pixel = ctx.surface.readPixel(pt.x, pt.y)
		if (!pixel) return

		ctx.dispatch(
			pickerPicked({
				which: mods.secondary ? "color2" : "color1",
				hex: rgbaToHex(pixel),
			}),
		)
	}

	paintOverlay(screen: Point, ctx: ToolContext): void {
		drawCursor(ctx.overlay, PICKER_CURSOR, screen)
	}
}
