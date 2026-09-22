import { PICKER_CURSOR } from "common/constant"
import { rgbaToHex } from "engine/color"
import { contains } from "engine/geometry"
import { drawCursor } from "engine/tools/cursorArt"
import { translate } from "locales/translate"
import { pickerPicked } from "store/actions"
import type { Modifiers, Tool, ToolContext } from "types/engine.types"
import type { Point } from "types/store.types"

/**
 * reads one committed pixel into a swatch and hands the previous tool back.
 * nothing is drawn: this tool never pushes a history step.
 */
export class PickerTool implements Tool {
	readonly id = "picker"

	get label(): string {
		return translate("history.label.picker")
	}

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
