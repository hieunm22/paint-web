import { CANVAS_AREA_FALLBACK } from "common/constant"
import type { Size } from "types/engine.types"

/** the largest area already seen to work, and the smallest known to fail. */
let good = 0
let bad = Number.POSITIVE_INFINITY

/**
 * whether a bitmap that big can really be backed here. every browser draws
 * its own line by area rather than by side, and iOS Safari draws it lowest,
 * so the answer is measured rather than assumed.
 */
export function fitsCanvas({ width, height }: Size): boolean {
	const area = width * height
	if (area <= 0) return false
	if (area <= good) return true
	if (area >= bad) return false

	if (typeof document === "undefined") return area <= CANVAS_AREA_FALLBACK

	if (probe(width, height)) {
		good = area
		return true
	}

	bad = area
	return false
}

/**
 * a canvas is allocated lazily: it is drawing on one and reading the far
 * corner back that proves the memory was really there.
 */
function probe(width: number, height: number): boolean {
	const canvas = document.createElement("canvas")
	canvas.width = width
	canvas.height = height

	try {
		// the same kind of context the surface uses: willReadFrequently would
		// pin this one to the cpu and measure a limit the app never meets
		const ctx = canvas.getContext("2d")
		if (!ctx || canvas.width !== width || canvas.height !== height) return false

		ctx.fillStyle = "#ffffff"
		ctx.fillRect(width - 1, height - 1, 1, 1)
		return ctx.getImageData(width - 1, height - 1, 1, 1).data[3] === 255
	} catch {
		return false
	} finally {
		// the bitmap goes as soon as both sides are zero, without waiting for
		// the collector to notice the element
		canvas.width = 0
		canvas.height = 0
	}
}
