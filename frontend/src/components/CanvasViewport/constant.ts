import fillCursor from "assets/cursors/fill.svg?url"
import magnifierCursor from "assets/cursors/magnifier.svg?url"
import pencilCursor from "assets/cursors/pencil.svg?url"
import pickerCursor from "assets/cursors/picker.svg?url"
import type { ToolId } from "store/types"
import type { CursorArt, HandlePosition } from "./types"

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

/** keyword cursor per tool, and the fallback when a drawn one cannot load. */
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

/**
 * drawn cursors and their hotspots. the artwork is hand-written svg under
 * assets/cursors: Paint's own cursors belong to microsoft, and a webfont glyph
 * cannot carry a hotspot. vite inlines each file, all well under the 4 kB limit.
 */
export const TOOL_CURSOR_ART: Partial<Record<ToolId, CursorArt>> = {
	pencil: { url: pencilCursor, x: 2, y: 22 },
	picker: { url: pickerCursor, x: 2, y: 22 },
	fill: { url: fillCursor, x: 3, y: 23 },
	magnifier: { url: magnifierCursor, x: 10, y: 10 },
}

/** the eraser footprint stays visible without swallowing the canvas. */
export const ERASER_CURSOR_MIN = 8
export const ERASER_CURSOR_MAX = 64

/** canvas is offset 6px from the viewport edge, anchored top-left. */
export const CANVAS_MARGIN = 6

/** ruler tick spacing in image pixels. */
export const RULER_MAJOR_STEP = 100
export const RULER_MINOR_STEP = 10
export const RULER_SIZE = 20
