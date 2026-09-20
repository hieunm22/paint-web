import { describe, expect, it } from "vitest"
import { SHAPE_DEFS } from "common/constant"
import type { ShapeSubpath } from "types/engine.types"
import type { ShapeKind } from "types/store.types"

const POINT_DRIVEN: ShapeKind[] = ["line", "curve", "polygon"]

/** the corners a subpath passes through, control points aside. */
function anchorsOf(subpath: ShapeSubpath) {
	return [subpath.start, ...subpath.segments.map(segment => segment.to)]
}

/** a control point may sit outside the box; the curve it pulls may not. */
function controlsOf(subpath: ShapeSubpath) {
	return subpath.segments.flatMap(segment =>
		[segment.c1, segment.c2].filter(one => one !== undefined),
	)
}

const CONTROL_SLACK = 0.15

describe("SHAPE_DEFS", () => {
	it("covers the whole gallery", () => {
		expect(Object.keys(SHAPE_DEFS)).toHaveLength(23)
	})

	it("gives every box shape an outline and every other one none", () => {
		for (const [kind, def] of Object.entries(SHAPE_DEFS)) {
			const driven = POINT_DRIVEN.includes(kind as ShapeKind)
			expect(def.outline === null).toBe(driven)
		}
	})

	it("keeps a line and a curve out of the fillable set", () => {
		expect(SHAPE_DEFS.line.fillable).toBe(false)
		expect(SHAPE_DEFS.curve.fillable).toBe(false)
		expect(SHAPE_DEFS.oval.fillable).toBe(true)
	})

	it("draws inside the unit box, which is what scales into the drag", () => {
		for (const [kind, def] of Object.entries(SHAPE_DEFS)) {
			for (const subpath of def.outline ?? []) {
				for (const point of anchorsOf(subpath)) {
					expect([kind, within(point.x, 0)]).toEqual([kind, true])
					expect([kind, within(point.y, 0)]).toEqual([kind, true])
				}
				for (const point of controlsOf(subpath)) {
					expect([kind, within(point.x, CONTROL_SLACK)]).toEqual([kind, true])
					expect([kind, within(point.y, CONTROL_SLACK)]).toEqual([kind, true])
				}
			}
		}
	})

	it("reaches the far side of the box, bumps and bends included", () => {
		for (const [kind, def] of Object.entries(SHAPE_DEFS)) {
			if (!def.outline) continue

			const points = def.outline.flatMap(subpath => [
				...anchorsOf(subpath),
				...controlsOf(subpath),
			])
			const wide = Math.max(...points.map(p => p.x)) > 0.9
			const tall = Math.max(...points.map(p => p.y)) > 0.9

			expect([kind, wide && tall]).toEqual([kind, true])
		}
	})
})

function within(value: number, slack: number): boolean {
	return value >= -slack - 0.001 && value <= 1 + slack + 0.001
}
