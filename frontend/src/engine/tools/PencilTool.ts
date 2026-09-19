import { stampSegment } from "./common"
import type { Point } from "store/types"
import type { Modifiers, Tool, ToolContext } from "../types"
import { constrainToAxis } from "../geometry"

const ORIGIN: Point = { x: 0, y: 0 }

/** one pixel wide at size 1, no antialiasing at any size. */
export class PencilTool implements Tool {
	readonly id = "pencil"
	readonly label = "Pencil"
	private origin: Point = ORIGIN
	private last: Point = ORIGIN

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		this.origin = pt
		this.last = pt
		stampSegment(ctx, pt, pt, colorFor(mods, ctx))
	}

	update(pts: Point[], mods: Modifiers, ctx: ToolContext): void {
		const color = colorFor(mods, ctx)

		for (const raw of pts) {
			const pt = mods.shift ? constrainToAxis(this.origin, raw) : raw
			stampSegment(ctx, this.last, pt, color)
			this.last = pt
		}
	}
}

/** left button paints colour 1, right button colour 2. */
function colorFor(mods: Modifiers, ctx: ToolContext): string {
	return mods.secondary ? ctx.color2 : ctx.color1
}
