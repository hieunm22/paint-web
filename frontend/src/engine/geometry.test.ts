import { describe, expect, it } from "vitest"
import {
	boundsOfPoints,
	clampRect,
	constrainToAxis,
	contains,
	insideRect,
	rectFromPoints,
	rectUnion,
	remapPoints,
	segmentBounds,
	squareFromPoints,
} from "engine/geometry"

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

describe("rectFromPoints", () => {
	it("orders the corners whichever way the drag went", () => {
		expect(rectFromPoints({ x: 9, y: 8 }, { x: 4, y: 2 })).toEqual({
			x: 4,
			y: 2,
			w: 5,
			h: 6,
		})
	})
})

describe("squareFromPoints", () => {
	it("takes the longer side and keeps the direction", () => {
		expect(squareFromPoints({ x: 10, y: 10 }, { x: 4, y: 8 })).toEqual({
			x: 4,
			y: 4,
		})
	})

	it("holds a zero drag at the anchor", () => {
		expect(squareFromPoints({ x: 3, y: 3 }, { x: 3, y: 3 })).toEqual({
			x: 3,
			y: 3,
		})
	})
})

describe("rectUnion", () => {
	it("covers the hole and the place the pixels landed", () => {
		const from = { x: 0, y: 0, w: 4, h: 4 }
		const to = { x: 6, y: 2, w: 4, h: 4 }

		expect(rectUnion(from, to)).toEqual({ x: 0, y: 0, w: 10, h: 6 })
	})
})

describe("boundsOfPoints", () => {
	it("boxes a traced path", () => {
		const path = [
			{ x: 4, y: 9 },
			{ x: 1, y: 3 },
			{ x: 7, y: 5 },
		]

		expect(boundsOfPoints(path)).toEqual({ x: 1, y: 3, w: 6, h: 6 })
	})

	it("has no box without points", () => {
		expect(boundsOfPoints([])).toBeNull()
	})
})

describe("remapPoints", () => {
	it("carries points across when a handle resizes the box", () => {
		const from = { x: 0, y: 0, w: 10, h: 10 }
		const to = { x: 5, y: 5, w: 20, h: 5 }

		expect(remapPoints([{ x: 5, y: 10 }], from, to)).toEqual([{ x: 15, y: 10 }])
	})

	it("leaves points alone when the old box was flat", () => {
		const flat = { x: 2, y: 2, w: 0, h: 0 }

		expect(remapPoints([{ x: 2, y: 2 }], flat, flat)).toEqual([{ x: 2, y: 2 }])
	})
})

describe("insideRect", () => {
	it("counts the edges as inside, the way a grab does", () => {
		const box = { x: 2, y: 2, w: 4, h: 4 }

		expect(insideRect(box, { x: 6, y: 6 })).toBe(true)
		expect(insideRect(box, { x: 6.5, y: 4 })).toBe(false)
	})
})
