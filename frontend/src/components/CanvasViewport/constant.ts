import type { ToolId } from "types/store.types"
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

/**
 * the five tools that draw their own cursor on the overlay hide the system
 * one: macOS scales a css cursor by its accessibility pointer size, and these
 * have to keep the size they were drawn at.
 */
export const TOOL_CURSORS: Record<ToolId, string> = {
	pencil: "none",
	fill: "none",
	text: "text",
	eraser: "none",
	picker: "none",
	magnifier: "none",
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
