import type { Point, ToolId } from "types/store.types"
import type { HandlePosition, ThumbnailCorner } from "./types"

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

/** the width the floating thumbnail opens at, in css pixels. */
export const THUMBNAIL_WIDTH = 336

/** the smallest either side of the thumbnail may be dragged to, in css pixels. */
export const THUMBNAIL_MIN = 80

/** the frame around the thumbnail canvas: its 5px margins and two 1px borders. */
export const THUMBNAIL_CHROME = 14

/** the same frame down the panel, which carries the title strip as well. */
export const THUMBNAIL_CHROME_Y = 32

/** clear space kept between the panel and the edges of the drawing area. */
export const THUMBNAIL_GAP = 12

/** the corners a grip sits on, clockwise from the top left. */
export const THUMBNAIL_CORNERS: ThumbnailCorner[] = ["nw", "ne", "se", "sw"]

export const THUMBNAIL_PULL: Record<ThumbnailCorner, Point> = {
	nw: { x: -1, y: -1 },
	ne: { x: 1, y: -1 },
	se: { x: 1, y: 1 },
	sw: { x: -1, y: 1 },
}

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
