import type { FlipAxis, TransformSpec } from "types/engine.types"

const DEGREES = Math.PI / 180

/** a detached canvas of the given size, which every transform writes into. */
export function canvasOf(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas")
	canvas.width = Math.max(1, Math.round(width))
	canvas.height = Math.max(1, Math.round(height))
	return canvas
}

/**
 * quarter turns clockwise. a multiple of 90 degrees moves whole pixels, which
 * is why smoothing goes off: there is nothing to interpolate.
 */
export function rotateImage(
	source: HTMLCanvasElement,
	turns: number,
): HTMLCanvasElement {
	const quarter = ((turns % 4) + 4) % 4
	const sideways = quarter % 2 === 1
	const width = sideways ? source.height : source.width
	const height = sideways ? source.width : source.height

	const canvas = canvasOf(width, height)
	const ctx = canvas.getContext("2d")
	if (!ctx) return canvas

	ctx.imageSmoothingEnabled = false
	ctx.translate(width / 2, height / 2)
	ctx.rotate(quarter * 90 * DEGREES)
	ctx.drawImage(source, -source.width / 2, -source.height / 2)
	return canvas
}

export function flipImage(
	source: HTMLCanvasElement,
	axis: FlipAxis,
): HTMLCanvasElement {
	const canvas = canvasOf(source.width, source.height)
	const ctx = canvas.getContext("2d")
	if (!ctx) return canvas

	const horizontal = axis === "h"
	ctx.imageSmoothingEnabled = false
	ctx.translate(horizontal ? source.width : 0, horizontal ? 0 : source.height)
	ctx.scale(horizontal ? -1 : 1, horizontal ? 1 : -1)
	ctx.drawImage(source, 0, 0)
	return canvas
}

/**
 * scale and shear in one pass. x grows by the horizontal angle's tangent
 * times y, and y by the vertical angle's tangent times x.
 */
export function transformImage(
	source: HTMLCanvasElement,
	spec: TransformSpec,
): HTMLCanvasElement {
	const width = Math.max(1, source.width * spec.scaleX)
	const height = Math.max(1, source.height * spec.scaleY)
	const shrunk = halveDown(source, width, height)
	const sx = width / shrunk.width
	const sy = height / shrunk.height
	const tx = Math.tan(spec.skewH * DEGREES)
	const ty = Math.tan(spec.skewV * DEGREES)

	const canvas = canvasOf(
		Math.ceil(width + Math.abs(tx) * height),
		Math.ceil(height + Math.abs(ty) * width),
	)
	const ctx = canvas.getContext("2d")
	if (!ctx) return canvas

	ctx.setTransform(
		sx,
		ty * sx,
		tx * sy,
		sy,
		tx < 0 ? -tx * height : 0,
		ty < 0 ? -ty * width : 0,
	)
	ctx.drawImage(shrunk, 0, 0)
	return canvas
}

/**
 * repeated halving on the way down to the target. one drawImage below half
 * size samples too few of the pixels it skips and the result comes out grainy.
 */
function halveDown(
	source: HTMLCanvasElement,
	width: number,
	height: number,
): HTMLCanvasElement {
	let current = source

	for (;;) {
		const w = Math.max(1, Math.round(current.width / 2))
		const h = Math.max(1, Math.round(current.height / 2))
		if (w === current.width && h === current.height) return current
		if (w < width || h < height) return current

		const step = canvasOf(w, h)
		step.getContext("2d")?.drawImage(current, 0, 0, w, h)
		current = step
	}
}
