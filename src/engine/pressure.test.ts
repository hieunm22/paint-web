import { describe, expect, it } from "vitest"
import { BRUSH_SPECS, PRESSURE_SMOOTHING } from "common/constant"
import {
	penPressure,
	penTilt,
	pressureSpec,
	smoothPressure,
} from "engine/pressure"
import type { StrokePoint } from "types/engine.types"
import type { Point } from "types/store.types"

function sample(
	pressure: number | null,
	tilt: Point | null = null,
): StrokePoint {
	return { x: 0, y: 0, pressure, tilt }
}

describe("penPressure", () => {
	it("reads force from a pen and from nothing else", () => {
		expect(penPressure("pen", 0.8)).toBe(0.8)
		expect(penPressure("mouse", 0.8)).toBeNull()
		expect(penPressure("touch", 1)).toBeNull()
	})

	it("treats the reported middle as no measurement at all", () => {
		expect(penPressure("pen", 0.5)).toBeNull()
	})

	it("ignores a pen that is not touching", () => {
		expect(penPressure("pen", 0)).toBeNull()
	})
})

describe("penTilt", () => {
	it("reports a lean only once the pen really leans", () => {
		expect(penTilt("pen", 30, 10)).toEqual({ x: 30, y: 10 })
		expect(penTilt("pen", 1, 1)).toBeNull()
		expect(penTilt("mouse", 30, 10)).toBeNull()
	})
})

describe("smoothPressure", () => {
	it("takes the first sample whole", () => {
		expect(smoothPressure(null, 0.8)).toBe(0.8)
	})

	it("folds a new sample into the last one", () => {
		expect(smoothPressure(0.4, 0.8)).toBeCloseTo(
			0.4 + PRESSURE_SMOOTHING * 0.4,
			6,
		)
	})

	it("forgets the last sample when the force goes away", () => {
		expect(smoothPressure(0.8, null)).toBeNull()
	})
})

describe("pressureSpec", () => {
	it("leaves every brush alone without a pen", () => {
		for (const spec of Object.values(BRUSH_SPECS)) {
			expect(pressureSpec(spec, sample(null))).toBe(spec)
		}
	})

	it("leaves the plain brush and the crayon alone even with one", () => {
		const hard = sample(0.9)

		expect(pressureSpec(BRUSH_SPECS.brush, hard)).toEqual(BRUSH_SPECS.brush)
		expect(pressureSpec(BRUSH_SPECS.crayon, hard)).toEqual(BRUSH_SPECS.crayon)
		expect(pressureSpec(BRUSH_SPECS.marker, hard)).toEqual(BRUSH_SPECS.marker)
	})

	it("hands the natural pencil force in place of speed", () => {
		const light = pressureSpec(BRUSH_SPECS["natural-pencil"], sample(0.1))
		const heavy = pressureSpec(BRUSH_SPECS["natural-pencil"], sample(1))

		expect(light.speed).toBeUndefined()
		expect(light.alpha).toBeLessThan(heavy.alpha)
	})

	it("thins an airbrush out under a light touch", () => {
		const light = pressureSpec(BRUSH_SPECS.airbrush, sample(0.1))
		const heavy = pressureSpec(BRUSH_SPECS.airbrush, sample(1))

		expect(light.spray?.rate).toBeLessThan(heavy.spray?.rate ?? 0)
		expect(light.spray?.rate).toBeGreaterThanOrEqual(1)
	})

	it("lays fewer watercolor layers under a light touch", () => {
		const light = pressureSpec(BRUSH_SPECS.watercolor, sample(0.2))
		const heavy = pressureSpec(BRUSH_SPECS.watercolor, sample(1))

		expect(light.passes).toBeLessThan(heavy.passes ?? 0)
		expect(light.passes).toBeGreaterThanOrEqual(1)
	})

	it("spreads the oil brush as the hand leans on it", () => {
		const light = pressureSpec(BRUSH_SPECS.oil, sample(0.1))
		const heavy = pressureSpec(BRUSH_SPECS.oil, sample(1))

		expect(light.width).toBeLessThan(heavy.width)
	})

	it("turns a calligraphy nib to the angle the pen is held at", () => {
		const flat = pressureSpec(
			BRUSH_SPECS.calligraphy1,
			sample(0.6, {
				x: 40,
				y: 0,
			}),
		)

		expect(flat.nib?.angle).toBeCloseTo(0, 6)
		expect(flat.nib?.thickness).toBe(BRUSH_SPECS.calligraphy1.nib?.thickness)
	})

	it("keeps the nib at its own angle while the pen stands upright", () => {
		const upright = pressureSpec(BRUSH_SPECS.calligraphy1, sample(0.6))

		expect(upright.nib?.angle).toBe(BRUSH_SPECS.calligraphy1.nib?.angle)
	})
})
