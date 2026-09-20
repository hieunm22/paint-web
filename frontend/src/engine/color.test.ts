import { describe, expect, it } from "vitest"
import { hexToRgba, rgbaToHex, sameColor } from "engine/color"

describe("hexToRgba", () => {
	it("reads a palette colour", () => {
		expect(hexToRgba("#ED1C24")).toEqual({ r: 237, g: 28, b: 36, a: 255 })
	})

	it("comes back opaque black when the string is not a colour", () => {
		expect(hexToRgba("transparent")).toEqual({ r: 0, g: 0, b: 0, a: 255 })
	})
})

describe("rgbaToHex", () => {
	it("pads every channel to two digits", () => {
		expect(rgbaToHex({ r: 0, g: 162, b: 232, a: 255 })).toBe("#00a2e8")
	})

	it("round trips a palette colour", () => {
		expect(rgbaToHex(hexToRgba("#B5E61D"))).toBe("#b5e61d")
	})
})

describe("sameColor", () => {
	it("compares alpha too, which the fill relies on", () => {
		const opaque = { r: 1, g: 2, b: 3, a: 255 }
		expect(sameColor(opaque, { ...opaque })).toBe(true)
		expect(sameColor(opaque, { ...opaque, a: 0 })).toBe(false)
	})
})
