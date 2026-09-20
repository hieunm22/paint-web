import { describe, expect, it } from "vitest"
import { needsVirtual, viewWindow, wholeDocument } from "engine/virtual"

const SMALL = { width: 1152, height: 648 }
const LARGE = { width: 8000, height: 6000 }
const VIEW = { x: 1000, y: 800, w: 1280, h: 720 }

describe("needsVirtual", () => {
	it("leaves an ordinary page drawn straight into the dom", () => {
		expect(needsVirtual(SMALL, 1)).toBe(false)
		expect(needsVirtual(SMALL, 3)).toBe(false)
	})

	it("windows a picture whose longest side is past the limit", () => {
		expect(needsVirtual(LARGE, 1)).toBe(true)
		expect(needsVirtual({ width: 4001, height: 10 }, 1)).toBe(true)
		expect(needsVirtual({ width: 4000, height: 10 }, 1)).toBe(false)
	})

	it("windows any picture once the zoom would blow the layer up", () => {
		expect(needsVirtual(SMALL, 4)).toBe(true)
		expect(needsVirtual(SMALL, 8)).toBe(true)
	})

	it("says no while there is no document at all", () => {
		expect(needsVirtual({ width: 0, height: 0 }, 8)).toBe(false)
	})
})

describe("viewWindow", () => {
	it("covers what the viewport shows plus a margin", () => {
		// 64 screen pixels of margin is 64 image ones at 100%
		expect(viewWindow(LARGE, VIEW, 1)).toEqual({
			x: 936,
			y: 736,
			w: 1408,
			h: 848,
		})
	})

	it("shrinks the margin as the zoom grows, it being screen pixels", () => {
		const box = viewWindow(LARGE, { x: 1000, y: 800, w: 160, h: 90 }, 8)

		// 64 screen pixels is 8 image ones at 800%
		expect(box).toEqual({ x: 992, y: 792, w: 176, h: 106 })
	})

	it("never reaches outside the paper", () => {
		const box = viewWindow(SMALL, { x: 0, y: 0, w: 4000, h: 4000 }, 1)

		expect(box).toEqual({ x: 0, y: 0, w: 1152, h: 648 })
	})

	it("holds nothing until the viewport has reported", () => {
		expect(viewWindow(LARGE, null, 1)).toEqual({ x: 0, y: 0, w: 0, h: 0 })
		expect(viewWindow({ width: 0, height: 0 }, VIEW, 1)).toEqual({
			x: 0,
			y: 0,
			w: 0,
			h: 0,
		})
	})
})

describe("wholeDocument", () => {
	it("is the window a picture drawn straight into the dom gets", () => {
		expect(wholeDocument(SMALL)).toEqual({ x: 0, y: 0, w: 1152, h: 648 })
	})
})
