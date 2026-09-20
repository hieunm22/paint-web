import { describe, expect, it } from "vitest"
import {
	boxToThumb,
	buildRulerTicks,
	fittedBox,
	resizedDocument,
	screenToImage,
	thumbToImage,
	visibleRect,
	zoomedSize,
} from "./common"

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

describe("fittedBox", () => {
	const box = { width: 168, height: 106 }

	it("centres a wide picture and leaves the bands above and below", () => {
		expect(fittedBox({ width: 1152, height: 648 }, box)).toEqual({
			x: 0,
			y: 6,
			w: 168,
			h: 95,
		})
	})

	it("has nothing to fit before the first document arrives", () => {
		expect(fittedBox({ width: 0, height: 0 }, box)).toBeNull()
	})
})

describe("visibleRect", () => {
	it("drops the canvas margin and divides the rest by the zoom", () => {
		const view = { width: 800, height: 600 }
		expect(visibleRect({ x: 206, y: 106 }, view, 2)).toEqual({
			x: 100,
			y: 50,
			w: 400,
			h: 300,
		})
	})
})

describe("boxToThumb", () => {
	const doc = { width: 200, height: 100 }
	const fit = { x: 4, y: 2, w: 100, h: 50 }

	it("scales an image box into the fitted picture", () => {
		expect(boxToThumb({ x: 20, y: 10, w: 40, h: 20 }, doc, fit)).toEqual({
			x: 14,
			y: 7,
			w: 20,
			h: 10,
		})
	})

	it("reads back the point a click in the thumbnail stands for", () => {
		expect(thumbToImage({ x: 14, y: 7 }, doc, fit)).toEqual({ x: 20, y: 10 })
	})
})

describe("resizedDocument", () => {
	const doc = { width: 200, height: 100 }

	it("moves only the edge the handle sits on", () => {
		expect(resizedDocument("e", doc, { x: 40, y: 40 })).toEqual({
			width: 240,
			height: 100,
		})
		expect(resizedDocument("s", doc, { x: 40, y: 40 })).toEqual({
			width: 200,
			height: 140,
		})
		expect(resizedDocument("se", doc, { x: 40, y: 40 })).toEqual({
			width: 240,
			height: 140,
		})
	})

	it("crops when the handle is dragged inwards", () => {
		expect(resizedDocument("se", doc, { x: -150, y: -30 })).toEqual({
			width: 50,
			height: 70,
		})
	})

	it("stops at one pixel and at the largest document the app opens", () => {
		expect(resizedDocument("se", doc, { x: -900, y: -900 })).toEqual({
			width: 1,
			height: 1,
		})
		expect(resizedDocument("e", doc, { x: 99999, y: 0 }).width).toBe(8000)
	})
})

describe("buildRulerTicks", () => {
	const ticks = buildRulerTicks(200, 1)

	it("labels the major ticks only, and never the zero", () => {
		expect(ticks.filter(t => t.label !== undefined).map(t => t.label)).toEqual([
			100, 200,
		])
	})

	it("steps every ten image pixels and offsets by the canvas margin", () => {
		expect(ticks[0].pos).toBe(6)
		expect(ticks[1].pos).toBe(16)
	})
})
