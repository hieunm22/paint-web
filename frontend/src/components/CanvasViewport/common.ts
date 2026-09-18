import type { Size } from "engine/types"
import type { Point } from "store/types"
import type { RulerTick } from "./types"
import { CANVAS_MARGIN, RULER_MAJOR_STEP, RULER_MINOR_STEP } from "./constant"

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
