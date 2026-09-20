import type { CSSProperties } from "react"
import { CANVAS_MARGIN, RULER_MAJOR_STEP, RULER_MINOR_STEP } from "./constant"
import type { Size } from "types/engine.types"
import type { Point, Rect, TextOptions } from "types/store.types"
import type { RulerTick } from "./types"

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

/** a handle sits centred on its point, whatever the zoom. */
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
