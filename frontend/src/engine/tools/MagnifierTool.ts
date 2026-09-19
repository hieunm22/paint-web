import { setZoom } from "store/slices/viewSlice"
import type { Point } from "store/types"
import type { Modifiers, Tool, ToolContext } from "../types"

/** the magnifier steps through its own four levels, not the zoom slider's. */
const LEVELS = [1, 2, 4, 8]

export class MagnifierTool implements Tool {
	readonly id = "magnifier"
	readonly label = "Magnifier"

	begin(_pt: Point, mods: Modifiers, ctx: ToolContext): void {
		const next = mods.secondary
			? [...LEVELS].reverse().find((level) => level < ctx.zoom)
			: LEVELS.find((level) => level > ctx.zoom)
		if (next) ctx.dispatch(setZoom(next))
	}
}
