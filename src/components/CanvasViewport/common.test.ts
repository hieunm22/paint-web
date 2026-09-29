import { describe, expect, it } from "vitest"
import {
	boxToThumb,
	buildRulerTicks,
	fittedBox,
	gridCell,
	resizedDocument,
	screenToImage,
	thumbnailBox,
	thumbToImage,
	visibleRect,
	zoomedSize,
} from "./common"

const RECT = { left: 100, top: 50 }

/** the canvas holds the whole picture, which is the ordinary case. */
const WHOLE = { x: 0, y: 0, w: 4000, h: 4000 }

describe("screenToImage", () => {
	it("maps one to one at 100%", () => {
		expect(screenToImage(140, 80, RECT, 1, WHOLE)).toEqual({ x: 40, y: 30 })
	})

	it("halves the distance at 200%, where one pixel covers four", () => {
		expect(screenToImage(140, 80, RECT, 2, WHOLE)).toEqual({ x: 20, y: 15 })
	})

	it("floors rather than rounds, so a pixel is not claimed early", () => {
		expect(screenToImage(143, 83, RECT, 2, WHOLE)).toEqual({ x: 21, y: 16 })
		// 31/8 is 3.875: floor keeps it on pixel 3, rounding would claim 4
		expect(screenToImage(141, 81, RECT, 8, WHOLE)).toEqual({ x: 5, y: 3 })
	})

	it("doubles the distance at 50%", () => {
		expect(screenToImage(140, 80, RECT, 0.5, WHOLE)).toEqual({ x: 80, y: 60 })
	})

	it("goes negative above and left of the canvas, which drawing clips", () => {
		expect(screenToImage(99, 49, RECT, 1, WHOLE)).toEqual({ x: -1, y: -1 })
	})

	it("adds the corner of the window when the canvas holds only part", () => {
		const window = { x: 600, y: 400, w: 800, h: 600 }

		expect(screenToImage(140, 80, RECT, 1, window)).toEqual({ x: 640, y: 430 })
		expect(screenToImage(140, 80, RECT, 4, window)).toEqual({ x: 610, y: 407 })
	})
})

describe("zoomedSize", () => {
	it("is the css size the canvas element is given", () => {
		expect(zoomedSize(1152, 648, 0.125)).toEqual({ width: 144, height: 81 })
	})
})

describe("fittedBox", () => {
	const box = { width: 168, height: 106 }

	it("centers a wide picture and leaves the bands above and below", () => {
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

describe("thumbnailBox", () => {
	/** a drawing area larger than the thumbnail is ever asked to grow. */
	const PANE = { width: 9999, height: 9999 }

	it("takes the dragged width and gives the picture's own proportions", () => {
		expect(thumbnailBox({ width: 1152, height: 648 }, 336, PANE)).toEqual({
			width: 336,
			height: 189,
		})
	})

	it("holds a tall picture to the height the drawing area allows", () => {
		expect(
			thumbnailBox({ width: 100, height: 800 }, 80, {
				width: 9999,
				height: 560,
			}),
		).toEqual({
			width: 70,
			height: 560,
		})
	})

	it("carries a wide picture up to the smallest side, then back inside", () => {
		expect(
			thumbnailBox({ width: 800, height: 100 }, 40, {
				width: 560,
				height: 9999,
			}),
		).toEqual({
			width: 560,
			height: 70,
		})
	})

	it("comes down to the drawing area, which keeps the grips in reach", () => {
		expect(
			thumbnailBox({ width: 1152, height: 648 }, 336, {
				width: 9999,
				height: 120,
			}),
		).toEqual({
			width: 213,
			height: 120,
		})
	})

	it("has no proportions to follow before the first document arrives", () => {
		expect(thumbnailBox({ width: 0, height: 0 }, 200, PANE)).toEqual({
			width: 200,
			height: 200,
		})
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

describe("gridCell", () => {
	it("draws one cell per image pixel from 400% up", () => {
		expect(gridCell(4)).toBe(1)
		expect(gridCell(8)).toBe(1)
	})

	it("gathers pixels into a cell of at least ten screen pixels below that", () => {
		expect(gridCell(3)).toBe(4)
		expect(gridCell(2)).toBe(5)
		expect(gridCell(1)).toBe(10)
		expect(gridCell(0.5)).toBe(20)
		expect(gridCell(0.125)).toBe(80)
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
