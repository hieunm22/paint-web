import { sameColor } from "engine/color"
import type { RGBA } from "types/engine.types"
import type { Point, Rect } from "types/store.types"

export function readPixel(img: ImageData, x: number, y: number): RGBA {
	const i = (y * img.width + x) << 2
	const d = img.data
	return { r: d[i], g: d[i + 1], b: d[i + 2], a: d[i + 3] }
}

function matches(data: Uint8ClampedArray, i: number, c: RGBA): boolean {
	return (
		data[i] === c.r &&
		data[i + 1] === c.g &&
		data[i + 2] === c.b &&
		data[i + 3] === c.a
	)
}

function write(data: Uint8ClampedArray, i: number, c: RGBA): void {
	data[i] = c.r
	data[i + 1] = c.g
	data[i + 2] = c.b
	data[i + 3] = c.a
}

/**
 * hard-edged line: Paint draws whole pixels, and ctx.lineTo would antialias
 * the ends into grey. `visit` receives every pixel centre on the way.
 */
export function bresenham(
	a: Point,
	b: Point,
	visit: (x: number, y: number) => void,
): void {
	let x = a.x
	let y = a.y
	const dx = Math.abs(b.x - x)
	const dy = -Math.abs(b.y - y)
	const sx = x < b.x ? 1 : -1
	const sy = y < b.y ? 1 : -1
	let err = dx + dy

	for (;;) {
		visit(x, y)
		if (x === b.x && y === b.y) return

		const e2 = 2 * err
		if (e2 >= dy) {
			err += dy
			x += sx
		}
		if (e2 <= dx) {
			err += dx
			y += sy
		}
	}
}

/**
 * scanline flood fill with zero tolerance, matching Paint. iterative on
 * purpose: recursion overflows the stack on a large uniform area.
 * returns the box that changed, or null when nothing did.
 */
export function floodFill(
	img: ImageData,
	seed: Point,
	fill: RGBA,
): Rect | null {
	const { width: w, height: h, data } = img
	const at = (x: number, y: number) => (y * w + x) << 2
	const target = readPixel(img, seed.x, seed.y)
	if (sameColor(target, fill)) return null

	let minX = seed.x
	let maxX = seed.x
	let minY = seed.y
	let maxY = seed.y
	const stack: number[] = [seed.x, seed.y]

	while (stack.length) {
		const y = stack.pop() as number
		const x0 = stack.pop() as number

		let x = x0
		while (x >= 0 && matches(data, at(x, y), target)) x--
		x++

		let spanUp = false
		let spanDown = false
		while (x < w && matches(data, at(x, y), target)) {
			write(data, at(x, y), fill)
			if (x < minX) minX = x
			if (x > maxX) maxX = x
			if (y < minY) minY = y
			if (y > maxY) maxY = y

			if (y > 0) {
				const up = matches(data, at(x, y - 1), target)
				if (up && !spanUp) {
					stack.push(x, y - 1)
					spanUp = true
				} else if (!up) spanUp = false
			}
			if (y < h - 1) {
				const down = matches(data, at(x, y + 1), target)
				if (down && !spanDown) {
					stack.push(x, y + 1)
					spanDown = true
				} else if (!down) spanDown = false
			}
			x++
		}
	}

	return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * stamps a square, repainting only the pixels that already hold `from`.
 * this is the right-button eraser, which swaps one colour for another.
 * `origin` is where the region sits in image coordinates.
 */
export function stampReplace(
	img: ImageData,
	origin: Point,
	centre: Point,
	size: number,
	from: RGBA,
	to: RGBA,
): void {
	const off = Math.floor(size / 2)
	const left = centre.x - off - origin.x
	const top = centre.y - off - origin.y

	for (let y = top; y < top + size; y++) {
		if (y < 0 || y >= img.height) continue
		for (let x = left; x < left + size; x++) {
			if (x < 0 || x >= img.width) continue

			const i = (y * img.width + x) << 2
			if (matches(img.data, i, from)) write(img.data, i, to)
		}
	}
}
