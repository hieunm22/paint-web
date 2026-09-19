import { describe, expect, it } from "vitest"
import {
	clampRect,
	constrainToAxis,
	contains,
	segmentBounds,
} from "./geometry"

const DOC = { width: 5, height: 5 }

describe("segmentBounds", () => {
	it("grows the box by the brush on every side", () => {
		expect(segmentBounds({ x: 10, y: 10 }, { x: 12, y: 10 }, 5)).toEqual({
			x: 8,
			y: 8,
			w: 7,
			h: 5,
		})
	})

	it("covers a single stamp at size 1", () => {
		expect(segmentBounds({ x: 4, y: 7 }, { x: 4, y: 7 }, 1)).toEqual({
			x: 4,
			y: 7,
			w: 1,
			h: 1,
		})
	})
})

describe("clampRect", () => {
	it("keeps only the part on the document", () => {
		expect(clampRect({ x: -3, y: 2, w: 10, h: 4 }, DOC)).toEqual({
			x: 0,
			y: 2,
			w: 5,
			h: 3,
		})
	})

	it("rejects a box that misses the document", () => {
		expect(clampRect({ x: -30, y: 0, w: 10, h: 4 }, DOC)).toBeNull()
	})
})

describe("contains", () => {
	it("excludes the far edge, which is the first pixel outside", () => {
		expect(contains(DOC, { x: 4, y: 4 })).toBe(true)
		expect(contains(DOC, { x: 5, y: 4 })).toBe(false)
		expect(contains(DOC, { x: 0, y: -1 })).toBe(false)
	})
})

describe("constrainToAxis", () => {
	const from = { x: 10, y: 10 }

	it("locks to the horizontal", () => {
		expect(constrainToAxis(from, { x: 40, y: 13 })).toEqual({ x: 40, y: 10 })
	})

	it("locks to the vertical", () => {
		expect(constrainToAxis(from, { x: 12, y: 40 })).toEqual({ x: 10, y: 40 })
	})

	it("locks to 45 degrees when neither axis dominates", () => {
		expect(constrainToAxis(from, { x: 30, y: 28 })).toEqual({ x: 29, y: 29 })
	})

	it("keeps the diagonal in the quadrant the pointer is in", () => {
		expect(constrainToAxis(from, { x: -10, y: 30 })).toEqual({ x: -10, y: 30 })
	})
})
