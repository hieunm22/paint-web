import { describe, expect, it } from "vitest"
import { buildRulerTicks, screenToImage, zoomedSize } from "./common"

const RECT = { left: 100, top: 50 }

describe("screenToImage", () => {
	it("maps one to one at 100%", () => {
		expect(screenToImage(140, 80, RECT, 1)).toEqual({ x: 40, y: 30 })
	})

	it("halves the distance at 200%, where one pixel covers four", () => {
		expect(screenToImage(140, 80, RECT, 2)).toEqual({ x: 20, y: 15 })
	})

	it("floors rather than rounds, so a pixel is not claimed early", () => {
		expect(screenToImage(143, 83, RECT, 2)).toEqual({ x: 21, y: 16 })
		// 31/8 is 3.875: floor keeps it on pixel 3, rounding would claim 4
		expect(screenToImage(141, 81, RECT, 8)).toEqual({ x: 5, y: 3 })
	})

	it("doubles the distance at 50%", () => {
		expect(screenToImage(140, 80, RECT, 0.5)).toEqual({ x: 80, y: 60 })
	})

	it("goes negative above and left of the canvas, which drawing clips", () => {
		expect(screenToImage(99, 49, RECT, 1)).toEqual({ x: -1, y: -1 })
	})
})

describe("zoomedSize", () => {
	it("is the css size the canvas element is given", () => {
		expect(zoomedSize(1152, 648, 0.125)).toEqual({ width: 144, height: 81 })
	})
})

describe("buildRulerTicks", () => {
	const ticks = buildRulerTicks(200, 1)

	it("labels the major ticks only, and never the zero", () => {
		expect(
			ticks.filter((t) => t.label !== undefined).map((t) => t.label),
		).toEqual([100, 200])
	})

	it("steps every ten image pixels and offsets by the canvas margin", () => {
		expect(ticks[0].pos).toBe(6)
		expect(ticks[1].pos).toBe(16)
	})
})
