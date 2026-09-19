import {
	faEyeDropper,
	faFillDrip,
	faMagnifyingGlass,
	faPencil,
	type IconDefinition,
} from "@fortawesome/pro-solid-svg-icons"
import type { Point } from "store/types"
import type { CursorArt } from "../types"

/**
 * the cursors are the ribbon's own glyphs, taken from the icon package: a
 * hand-drawn lookalike drifts from the toolbar the moment either side is
 * touched. hotspots come from where each glyph's working end sits.
 */
export const PENCIL_CURSOR: CursorArt = {
	icon: faPencil,
	size: 20,
	hotX: 0.04,
	hotY: 0.95,
}
export const PICKER_CURSOR: CursorArt = {
	icon: faEyeDropper,
	size: 20,
	hotX: 0.04,
	hotY: 0.95,
}
export const FILL_CURSOR: CursorArt = {
	icon: faFillDrip,
	size: 22,
	hotX: 0.72,
	hotY: 0.62,
}
export const MAGNIFIER_CURSOR: CursorArt = {
	icon: faMagnifyingGlass,
	size: 20,
	hotX: 0.34,
	hotY: 0.34,
}

interface Glyph {
	path: Path2D
	width: number
	height: number
}

const glyphs = new Map<IconDefinition, Glyph>()

/** built once per icon. node has no Path2D and never draws a cursor. */
function glyphFor(icon: IconDefinition): Glyph | null {
	if (typeof Path2D === "undefined") return null

	const cached = glyphs.get(icon)
	if (cached) return cached

	const [width, height, , , outline] = icon.icon
	// a duotone glyph carries two layers; a cursor draws the first
	const glyph = {
		path: new Path2D(Array.isArray(outline) ? outline[0] : outline),
		width,
		height,
	}
	glyphs.set(icon, glyph)
	return glyph
}

/**
 * puts the glyph's hotspot on the pointer. drawn on the overlay rather than
 * handed to css because macOS scales a css cursor by its accessibility pointer
 * size, and these have to keep the size they were drawn at.
 */
export function drawCursor(
	paint: CanvasRenderingContext2D,
	art: CursorArt,
	at: Point,
): void {
	const glyph = glyphFor(art.icon)
	if (!glyph) return

	const scale = art.size / Math.max(glyph.width, glyph.height)

	paint.save()
	paint.translate(
		Math.round(at.x - glyph.width * scale * art.hotX),
		Math.round(at.y - glyph.height * scale * art.hotY),
	)
	paint.scale(scale, scale)
	// a white rim keeps a black glyph readable over dark pixels
	paint.lineWidth = 2 / scale
	paint.lineJoin = "round"
	paint.strokeStyle = "#ffffff"
	paint.stroke(glyph.path)
	paint.fillStyle = "#000000"
	paint.fill(glyph.path)
	paint.restore()
}

/** the eraser shows the square it will clear, at the real size and zoom. */
export function drawSquareCursor(
	paint: CanvasRenderingContext2D,
	at: Point,
	side: number,
): void {
	const x = Math.round(at.x - side / 2)
	const y = Math.round(at.y - side / 2)

	paint.save()
	paint.lineWidth = 1
	paint.strokeStyle = "#ffffff"
	paint.strokeRect(x - 0.5, y - 0.5, side + 1, side + 1)
	paint.strokeStyle = "#000000"
	paint.strokeRect(x + 0.5, y + 0.5, side, side)
	paint.restore()
}
