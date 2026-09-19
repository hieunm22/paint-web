import type { Size } from "engine/types"
import type { Point, ToolId } from "store/types"
import type { RulerTick } from "./types"
import {
	CANVAS_MARGIN,
	ERASER_CURSOR_MAX,
	ERASER_CURSOR_MIN,
	RULER_MAJOR_STEP,
	RULER_MINOR_STEP,
	TOOL_CURSOR_ART,
	TOOL_CURSORS,
} from "./constant"

/** css size of a document-space layer at the current zoom. */
export function zoomedSize(width: number, height: number, zoom: number): Size {
	return { width: width * zoom, height: height * zoom }
}

/**
 * builds the ruler ticks
 */
export function buildRulerTicks(length: number, zoom: number): RulerTick[] {
	const ticks: RulerTick[] = []

	for (let v = 0; v <= length; v += RULER_MINOR_STEP) {
		const isMajor = v % RULER_MAJOR_STEP === 0
		const isMid = v % (RULER_MINOR_STEP * 5) === 0

		ticks.push({
			pos: v * zoom + CANVAS_MARGIN,
			size: isMajor ? 12 : isMid ? 8 : 4,
			label: isMajor && v > 0 ? v : undefined,
		})
	}

	return ticks
}

/**
 * converts client pixels to image pixels.
 */
export function screenToImage(
	clientX: number,
	clientY: number,
	rect: { left: number; top: number },
	zoom: number,
): Point {
	return {
		x: Math.floor((clientX - rect.left) / zoom),
		y: Math.floor((clientY - rect.top) / zoom),
	}
}

function cursorRule(
	url: string,
	x: number,
	y: number,
	fallback: string,
): string {
	return `url("${url}") ${x} ${y}, ${fallback}`
}

/**
 * the eraser wears its own footprint, so it grows with the size and the zoom
 * the way the erased square does.
 */
function eraserCursor(size: number, zoom: number, fallback: string): string {
	const side = Math.min(
		ERASER_CURSOR_MAX,
		Math.max(ERASER_CURSOR_MIN, Math.round(size * zoom)),
	)
	const box = side + 2
	// the only cursor built at runtime: its side follows the size and the zoom,
	// which no static file can do
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box}" height="${box}"><rect x="0.5" y="0.5" width="${side + 1}" height="${side + 1}" fill="#fff" stroke="#000"/></svg>`
	const url = `data:image/svg+xml,${encodeURIComponent(svg)}`

	return cursorRule(url, Math.round(box / 2), Math.round(box / 2), fallback)
}

/** css cursor for the active tool. */
export function toolCursor(tool: ToolId, size: number, zoom: number): string {
	const fallback = TOOL_CURSORS[tool]
	if (tool === "eraser") return eraserCursor(size, zoom, fallback)

	const art = TOOL_CURSOR_ART[tool]
	return art ? cursorRule(art.url, art.x, art.y, fallback) : fallback
}
