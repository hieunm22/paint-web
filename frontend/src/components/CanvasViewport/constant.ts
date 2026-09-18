import type { ToolId } from "store/types"
import type { HandlePosition } from "./types"

/** eight document resize handles. */
export const HANDLES: HandlePosition[] = [
	"nw",
	"n",
	"ne",
	"w",
	"e",
	"sw",
	"s",
	"se",
]

/** cursor changes with the active tool. */
export const TOOL_CURSORS: Record<ToolId, string> = {
	pencil: "crosshair",
	fill: "crosshair",
	text: "text",
	eraser: "crosshair",
	picker: "crosshair",
	magnifier: "zoom-in",
	brush: "crosshair",
	shape: "crosshair",
	"select-rect": "crosshair",
	"select-free": "crosshair",
}

/** canvas is offset 6px from the viewport edge, anchored top-left. */
export const CANVAS_MARGIN = 6

/** ruler tick spacing in image pixels. */
export const RULER_MAJOR_STEP = 100
export const RULER_MINOR_STEP = 10
export const RULER_SIZE = 20
