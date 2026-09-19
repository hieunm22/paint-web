import { translate } from "locales/translate"
import { zoomAt } from "store/slices/viewSlice"
import type { Point } from "store/types"
import type { Modifiers, Tool, ToolContext } from "../types"
import { drawCursor, MAGNIFIER_CURSOR } from "./cursorArt"

/** the magnifier steps through its own four levels, not the zoom slider's. */
const LEVELS = [1, 2, 4, 8]

function nextLevel(zoom: number, back: boolean): number | undefined {
	return back
		? [...LEVELS].reverse().find((level) => level < zoom)
		: LEVELS.find((level) => level > zoom)
}

export class MagnifierTool implements Tool {
	readonly id = "magnifier"

	get label(): string {
		return translate("history.label.magnifier")
	}

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		const next = nextLevel(ctx.zoom, mods.secondary)
		if (next) ctx.dispatch(zoomAt({ zoom: next, at: pt }))
	}

	/**
	 * the box holds exactly what the viewport will show after zooming in, so
	 * its size shrinks as the step gets bigger.
	 */
	paintOverlay(screen: Point, ctx: ToolContext): void {
		drawCursor(ctx.overlay, MAGNIFIER_CURSOR, screen)

		const next = nextLevel(ctx.zoom, false)
		if (!next) return

		const w = Math.round((ctx.overlaySize.width * ctx.zoom) / next)
		const h = Math.round((ctx.overlaySize.height * ctx.zoom) / next)
		const x = Math.round(screen.x - w / 2)
		const y = Math.round(screen.y - h / 2)
		const paint = ctx.overlay

		paint.save()
		paint.lineWidth = 1
		// white underneath keeps the box readable over a dark picture
		paint.strokeStyle = "#ffffff"
		paint.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1)
		paint.strokeStyle = "#000000"
		paint.setLineDash([3, 3])
		paint.strokeRect(x + 0.5, y + 0.5, w, h)
		paint.restore()
	}
}
