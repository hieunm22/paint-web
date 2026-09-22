import { describe, expect, it } from "vitest"
import { BOX_CURSORS, BOX_HANDLE_SPOTS } from "common/constant"
import {
	boundsOfPoints,
	boxHandles,
	clampRect,
	constrainToAxis,
	contains,
	insideRect,
	nearestGrip,
	rectFromPoints,
	rectUnion,
	remapPoints,
	resizeBox,
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

describe("boxHandles", () => {
	it("gives the four corners then the edge midpoints", () => {
		const handles = boxHandles({ x: 10, y: 20, w: 40, h: 60 })

		expect(handles).toHaveLength(8)
		expect(handles[0]).toEqual({ x: 10, y: 20 })
		expect(handles[1]).toEqual({ x: 30, y: 20 })
		expect(handles[7]).toEqual({ x: 50, y: 80 })
	})
})

describe("nearestGrip", () => {
	const handles = boxHandles({ x: 0, y: 0, w: 100, h: 100 })

	it("finds the handle under the pointer", () => {
		expect(nearestGrip(handles, { x: 100, y: 100 }, 1)).toBe(7)
	})

	it("reaches no further than a few pixels", () => {
		expect(nearestGrip(handles, { x: 50, y: 50 }, 1)).toBe(-1)
	})

	// zoomed in, one image pixel covers several on screen
	it("narrows the reach as the zoom grows", () => {
		expect(nearestGrip(handles, { x: 5, y: 0 }, 1)).toBe(0)
		expect(nearestGrip(handles, { x: 5, y: 0 }, 8)).toBe(-1)
	})
})

describe("resizeBox", () => {
	const box = { x: 10, y: 10, w: 100, h: 100 }

	it("moves the dragged corner and leaves the opposite one put", () => {
		expect(resizeBox(box, 7, { x: 60, y: 40 })).toEqual({
			x: 10,
			y: 10,
			w: 50,
			h: 30,
		})
	})

	it("moves one side only when an edge handle is dragged", () => {
		expect(resizeBox(box, 1, { x: 999, y: 30 })).toEqual({
			x: 10,
			y: 30,
			w: 100,
			h: 80,
		})
	})

	it("normalizes a drag past the opposite side", () => {
		expect(resizeBox(box, 0, { x: 150, y: 150 })).toEqual({
			x: 110,
			y: 110,
			w: 40,
			h: 40,
		})
	})
})

describe("the handle cursors", () => {
	// the two tables are read by index; a row added to one needs the other
	it("line up with the handles they belong to", () => {
		expect(BOX_CURSORS).toHaveLength(BOX_HANDLE_SPOTS.length)
	})

	it("point the way each handle stretches the box", () => {
		const north = BOX_HANDLE_SPOTS.findIndex(s => s.x === 0.5 && s.y === 0)
		const corner = BOX_HANDLE_SPOTS.findIndex(s => s.x === 1 && s.y === 1)

		expect(BOX_CURSORS[north]).toBe("ns-resize")
		expect(BOX_CURSORS[corner]).toBe("nwse-resize")
	})
})
