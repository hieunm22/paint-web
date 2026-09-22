import { describe, expect, it } from "vitest"
import {
	hexToRgba,
	rgbaToHex,
	rgbaToWinHsl,
	sameColor,
	winHslToRgba,
} from "engine/color"

describe("hexToRgba", () => {
	it("reads a palette color", () => {
		expect(hexToRgba("#ED1C24")).toEqual({ r: 237, g: 28, b: 36, a: 255 })
	})

	it("comes back opaque black when the string is not a color", () => {
		expect(hexToRgba("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 255 })
	})
})

describe("rgbaToHex", () => {
	it("pads every channel to two digits", () => {
		expect(rgbaToHex({ r: 0, g: 162, b: 232, a: 255 })).toBe("#00a2e8")
	})

	it("round trips a palette color", () => {
		expect(rgbaToHex(hexToRgba("#B5E61D"))).toBe("#b5e61d")
	})
})

describe("rgbaToWinHsl", () => {
	it("counts on the scales the Windows dialog prints", () => {
		expect(rgbaToWinHsl(hexToRgba("#ff0000"))).toEqual({ h: 0, s: 240, l: 120 })
		expect(rgbaToWinHsl(hexToRgba("#00ff00"))).toEqual({
			h: 80,
			s: 240,
			l: 120,
		})
		expect(rgbaToWinHsl(hexToRgba("#0000ff"))).toEqual({
			h: 160,
			s: 240,
			l: 120,
		})
	})

	it("reports no hue and no saturation for a gray", () => {
		expect(rgbaToWinHsl(hexToRgba("#808080"))).toEqual({ h: 0, s: 0, l: 120 })
		expect(rgbaToWinHsl(hexToRgba("#ffffff"))).toEqual({ h: 0, s: 0, l: 240 })
	})
})

describe("winHslToRgba", () => {
	it("comes back to the primaries and the grays exactly", () => {
		for (const hex of ["#ff0000", "#00ff00", "#0000ff", "#000000", "#808080"]) {
			expect(rgbaToHex(winHslToRgba(rgbaToWinHsl(hexToRgba(hex))))).toBe(hex)
		}
	})

	// 240 steps of hue cannot name all 16.7 million colors, which is why the
	// dialog keeps the channels and not the conversion
	it("comes back within a step or two for anything else", () => {
		for (const hex of ["#ed1c24", "#00a2e8", "#b5e61d"]) {
			const back = winHslToRgba(rgbaToWinHsl(hexToRgba(hex)))
			const from = hexToRgba(hex)
			expect(Math.abs(back.r - from.r)).toBeLessThanOrEqual(3)
			expect(Math.abs(back.g - from.g)).toBeLessThanOrEqual(3)
			expect(Math.abs(back.b - from.b)).toBeLessThanOrEqual(3)
		}
	})

	it("darkens to black and lightens to white whatever the hue", () => {
		expect(winHslToRgba({ h: 160, s: 240, l: 0 })).toEqual({
			r: 0,
			g: 0,
			b: 0,
			a: 255,
		})
		expect(winHslToRgba({ h: 160, s: 240, l: 240 })).toEqual({
			r: 255,
			g: 255,
			b: 255,
			a: 255,
		})
	})
})

describe("sameColor", () => {
	it("compares alpha too, which the fill relies on", () => {
		const opaque = { r: 1, g: 2, b: 3, a: 255 }
		expect(sameColor(opaque, { ...opaque })).toBe(true)
		expect(sameColor(opaque, { ...opaque, a: 0 })).toBe(false)
	})
})
