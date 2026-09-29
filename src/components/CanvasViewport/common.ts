import type { CSSProperties } from "react"
import { MAX_DIMENSION } from "common/constant"
import {
	CANVAS_MARGIN,
	GRID_MIN_SPACING,
	GRID_PIXEL_ZOOM,
	GRID_STEPS,
	RULER_MAJOR_STEP,
	RULER_MINOR_STEP,
	THUMBNAIL_MIN,
} from "./constant"
import type { Size } from "types/engine.types"
import type { Point, Rect, TextOptions } from "types/store.types"
import type { HandlePosition, RulerTick } from "./types"

/** css size of a document-space layer at the current zoom. */
export function zoomedSize(width: number, height: number, zoom: number): Size {
	return { width: width * zoom, height: height * zoom }
}

/** image pixels per grid cell. */
export function gridCell(zoom: number): number {
	if (zoom >= GRID_PIXEL_ZOOM) return 1

	const step = GRID_STEPS.find(s => s * zoom >= GRID_MIN_SPACING)
	return step ?? GRID_STEPS[GRID_STEPS.length - 1]
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
 * converts client pixels to image pixels. `box` is the part of the picture the
 * drawing canvas holds, whose corner is the paper's only when it holds it all.
 */
export function screenToImage(
	clientX: number,
	clientY: number,
	rect: { left: number; top: number },
	zoom: number,
	box: Rect,
): Point {
	return {
		x: box.x + Math.floor((clientX - rect.left) / zoom),
		y: box.y + Math.floor((clientY - rect.top) / zoom),
	}
}

/** an image-space box placed over the canvas, which scales with the zoom. */
export function overlayBox(rect: Rect, zoom: number): CSSProperties {
	return {
		left: rect.x * zoom,
		top: rect.y * zoom,
		width: rect.w * zoom,
		height: rect.h * zoom,
	}
}

/** an image-space outline written in the svg overlay's screen pixels. */
export function lassoPoints(points: Point[], zoom: number): string {
	return points.map(p => `${p.x * zoom},${p.y * zoom}`).join(" ")
}

/** a handle sits centered on its point, whatever the zoom. */
export function overlayGrip(point: Point, zoom: number): CSSProperties {
	return { left: point.x * zoom, top: point.y * zoom }
}

/**
 * the text box plus the band that drags it. the band is screen pixels on every
 * side, which is why this cannot go through `overlayBox`.
 */
export function textFrameBox(
	rect: Rect,
	zoom: number,
	band: number,
): CSSProperties {
	return {
		left: rect.x * zoom - band,
		top: rect.y * zoom - band,
		width: rect.w * zoom + band * 2,
		height: rect.h * zoom + band * 2,
		padding: band,
	}
}

/** the two rules css draws for us, which the bake then repeats by hand. */
export function textDecoration(options: TextOptions): string {
	const rules = [
		options.underline && "underline",
		options.strikethrough && "line-through",
	].filter(Boolean)

	return rules.length ? rules.join(" ") : "none"
}

/**
 * the top left image pixel a scrolled viewport is showing, which is where a
 * paste lands. the canvas sits a fixed margin inside the scrolling box.
 */
export function visiblePixel(
	scrollLeft: number,
	scrollTop: number,
	zoom: number,
): Point {
	return {
		x: Math.max(0, Math.floor((scrollLeft - CANVAS_MARGIN) / zoom)),
		y: Math.max(0, Math.floor((scrollTop - CANVAS_MARGIN) / zoom)),
	}
}

/** the part of the picture a scrolled viewport shows, in image pixels. */
export function visibleRect(scroll: Point, view: Size, zoom: number): Rect {
	const at = visiblePixel(scroll.x, scroll.y, zoom)

	return { x: at.x, y: at.y, w: view.width / zoom, h: view.height / zoom }
}

export function thumbnailBox(doc: Size, width: number, max: Size): Size {
	if (!doc.width || !doc.height) return { width, height: width }

	const wide = Math.max(THUMBNAIL_MIN, max.width)
	const high = Math.max(THUMBNAIL_MIN, max.height)
	const tall = (width * doc.height) / doc.width
	const grow = Math.max(1, THUMBNAIL_MIN / width, THUMBNAIL_MIN / tall)
	const shrink = Math.min(1, wide / (width * grow), high / (tall * grow))

	return {
		width: Math.round(width * grow * shrink),
		height: Math.round(tall * grow * shrink),
	}
}

/** the picture centered in the thumbnail box, its proportions kept. */
export function fittedBox(doc: Size, box: Size): Rect | null {
	if (!doc.width || !doc.height) return null

	const scale = Math.min(box.width / doc.width, box.height / doc.height)
	const w = Math.max(1, Math.round(doc.width * scale))
	const h = Math.max(1, Math.round(doc.height * scale))

	return {
		x: Math.round((box.width - w) / 2),
		y: Math.round((box.height - h) / 2),
		w,
		h,
	}
}

/** an image-space box in the coordinates of the fitted thumbnail. */
export function boxToThumb(rect: Rect, doc: Size, fit: Rect): Rect {
	const sx = fit.w / doc.width
	const sy = fit.h / doc.height

	return {
		x: fit.x + rect.x * sx,
		y: fit.y + rect.y * sy,
		w: rect.w * sx,
		h: rect.h * sy,
	}
}

/**
 * the paper a handle drag would leave behind. only the right and bottom edges
 * move, which keeps the picture in the corner it is anchored to.
 */
export function resizedDocument(
	handle: HandlePosition,
	doc: Size,
	delta: Point,
): Size {
	return {
		width: clampSide(doc.width + (handle.includes("e") ? delta.x : 0)),
		height: clampSide(doc.height + (handle.includes("s") ? delta.y : 0)),
	}
}

function clampSide(value: number): number {
	return Math.max(1, Math.min(MAX_DIMENSION, Math.round(value)))
}

/** where a click in the thumbnail lands on the picture. */
export function thumbToImage(at: Point, doc: Size, fit: Rect): Point {
	return {
		x: ((at.x - fit.x) / fit.w) * doc.width,
		y: ((at.y - fit.y) / fit.h) * doc.height,
	}
}
