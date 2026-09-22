import { describe, expect, it } from "vitest"
import {
	clampScale,
	clampSkew,
	levelAt,
	linkedValue,
	scaleOf,
	toneAt,
	wholeOf,
} from "./common"

describe("toneAt", () => {
	it("reads hue across the field and saturation up it", () => {
		expect(toneAt(0.5, 0, 90)).toEqual({ h: 120, s: 240, l: 90 })
		expect(toneAt(0, 1, 90)).toEqual({ h: 0, s: 0, l: 90 })
	})

	it("lifts a black or white color off the end, where no hue shows", () => {
		expect(toneAt(0.5, 0, 0).l).toBe(120)
		expect(toneAt(0.5, 0, 240).l).toBe(120)
	})
})

describe("levelAt", () => {
	it("runs from white at the top of the bar to black at the bottom", () => {
		expect(levelAt(0)).toBe(240)
		expect(levelAt(1)).toBe(0)
	})
})

describe("wholeOf", () => {
	it("reads as a full hundred percent, or as the side in pixels", () => {
		expect(wholeOf("percent", 800)).toBe(100)
		expect(wholeOf("pixels", 800)).toBe(800)
	})
})

describe("scaleOf", () => {
	it("turns either unit into the same factor", () => {
		expect(scaleOf("percent", 50, 800)).toBe(0.5)
		expect(scaleOf("pixels", 400, 800)).toBe(0.5)
	})

	it("leaves a zero-width target alone rather than dividing by it", () => {
		expect(scaleOf("pixels", 400, 0)).toBe(1)
	})
})

describe("linkedValue", () => {
	it("matches the other percentage exactly", () => {
		expect(linkedValue("percent", 60, 800, 600)).toBe(60)
	})

	it("carries the aspect ratio across in pixels", () => {
		expect(linkedValue("pixels", 400, 800, 600)).toBe(300)
	})

	it("never links down to nothing", () => {
		expect(linkedValue("pixels", 1, 800, 6)).toBe(1)
	})
})

describe("clampSkew", () => {
	it("stops short of the angle that flattens the matrix", () => {
		expect(clampSkew(120)).toBe(89)
		expect(clampSkew(-120)).toBe(-89)
		expect(clampSkew(30)).toBe(30)
	})
})

describe("clampScale", () => {
	it("keeps the result inside what the app will open again", () => {
		expect(clampScale(4, 8000)).toBe(1)
		expect(clampScale(2, 1000)).toBe(2)
	})

	it("refuses a factor with no picture in it", () => {
		expect(clampScale(0, 800)).toBe(1)
		expect(clampScale(-2, 800)).toBe(1)
	})
})
