import type { CSSProperties } from "react"
import { CANVAS_MARGIN, RULER_MAJOR_STEP, RULER_MINOR_STEP } from "./constant"
import type { Size } from "types/engine.types"
import type { Point, Rect } from "types/store.types"
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
	return points.map((p) => `${p.x * zoom},${p.y * zoom}`).join(" ")
}

/** a handle sits centred on its point, whatever the zoom. */
export function overlayGrip(point: Point, zoom: number): CSSProperties {
	return { left: point.x * zoom, top: point.y * zoom }
}
