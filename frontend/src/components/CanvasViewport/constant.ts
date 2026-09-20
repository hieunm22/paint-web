import type { Size } from "types/engine.types"
import type { ToolId } from "types/store.types"
import type { HandlePosition } from "./types"

/**
 * the document resize handles, on the two edges that can move: the picture is
 * anchored top left, and a top or left handle would have to carry it along.
 */
export const HANDLES: HandlePosition[] = ["e", "s", "se"]

/**
 * the tools that draw their own cursor hide the system one: macOS scales a css
 * cursor by the accessibility pointer size, and these keep the size drawn.
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

/** the floating thumbnail, in css pixels. */
export const THUMBNAIL_BOX: Size = { width: 168, height: 106 }

/** the frame around the viewed part of the picture. */
export const THUMBNAIL_FRAME = "#d00000"

/**
 * the thumbnail repaints on a timer: the engine draws outside react, and this
 * is often enough to follow a stroke without costing a frame of it.
 */
export const THUMBNAIL_INTERVAL_MS = 100

/** ruler tick spacing in image pixels. */
export const RULER_MAJOR_STEP = 100
export const RULER_MINOR_STEP = 10
export const RULER_SIZE = 20
