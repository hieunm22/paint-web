import { describe, expect, it } from "vitest"
import type { RGBA } from "./types"
import { bresenham, floodFill, readPixel, stampReplace } from "./raster"

const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 255 }
const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 255 }
const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 }

/** node has no ImageData; the raster helpers only read data, width and height. */
function sheet(width: number, height: number, fill: RGBA): ImageData {
	const data = new Uint8ClampedArray(width * height * 4)
	for (let i = 0; i < width * height; i++) {
		data.set([fill.r, fill.g, fill.b, fill.a], i * 4)
	}
	return { data, width, height } as ImageData
}

function put(img: ImageData, x: number, y: number, c: RGBA): void {
	img.data.set([c.r, c.g, c.b, c.a], (y * img.width + x) * 4)
}

describe("bresenham", () => {
	it("visits both ends and every step between", () => {
		const seen: string[] = []
		bresenham({ x: 0, y: 0 }, { x: 3, y: 2 }, (x, y) => seen.push(`${x},${y}`))
		expect(seen).toEqual(["0,0", "1,1", "2,1", "3,2"])
	})

	it("visits a zero length segment once, which is a click", () => {
		const seen: string[] = []
		bresenham({ x: 5, y: 5 }, { x: 5, y: 5 }, (x, y) => seen.push(`${x},${y}`))
		expect(seen).toEqual(["5,5"])
	})

	it("walks backwards as readily as forwards", () => {
		const seen: string[] = []
		bresenham({ x: 2, y: 0 }, { x: 0, y: 0 }, (x) => seen.push(String(x)))
		expect(seen).toEqual(["2", "1", "0"])
	})
})

describe("floodFill", () => {
	it("stops at a wall and reports the box it changed", () => {
		const img = sheet(5, 3, WHITE)
		for (let y = 0; y < 3; y++) put(img, 2, y, BLACK)

		expect(floodFill(img, { x: 0, y: 0 }, RED)).toEqual({
			x: 0,
			y: 0,
			w: 2,
			h: 3,
		})
		expect(readPixel(img, 1, 2)).toEqual(RED)
		expect(readPixel(img, 3, 1)).toEqual(WHITE)
	})

	it("reaches around a wall that does not span the height", () => {
		const img = sheet(5, 3, WHITE)
		put(img, 2, 0, BLACK)
		put(img, 2, 1, BLACK)

		floodFill(img, { x: 0, y: 0 }, RED)
		expect(readPixel(img, 4, 0)).toEqual(RED)
	})

	it("refuses to repaint the colour already there", () => {
		const img = sheet(3, 3, WHITE)
		expect(floodFill(img, { x: 1, y: 1 }, WHITE)).toBeNull()
	})
})

describe("stampReplace", () => {
	it("repaints only the pixels holding the colour being replaced", () => {
		const region = sheet(3, 3, WHITE)
		put(region, 1, 1, BLACK)

		stampReplace(region, { x: 0, y: 0 }, { x: 1, y: 1 }, 3, BLACK, RED)
		expect(readPixel(region, 1, 1)).toEqual(RED)
		expect(readPixel(region, 0, 0)).toEqual(WHITE)
	})

	it("clips a stamp that hangs over the edge of the region", () => {
		const region = sheet(2, 2, BLACK)

		stampReplace(region, { x: 10, y: 10 }, { x: 10, y: 10 }, 5, BLACK, RED)
		expect(readPixel(region, 0, 0)).toEqual(RED)
		expect(readPixel(region, 1, 1)).toEqual(RED)
	})
})
