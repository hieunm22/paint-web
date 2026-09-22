import { describe, expect, it } from "vitest"
import { DEFAULT_PRINT_SETUP } from "common/constant"
import { printLayout } from "common/print"
import type { PrintSetup } from "types/store.types"

/** 1152 pixels at 96 to the inch, in millimetres. */
const WIDE_MM = (1152 / 96) * 25.4

const DOC = { width: 1152, height: 648 }

function setup(changes: Partial<PrintSetup> = {}): PrintSetup {
	return { ...DEFAULT_PRINT_SETUP, ...changes }
}

describe("printLayout", () => {
	it("keeps the printable box inside the margins", () => {
		const layout = printLayout(DOC, setup())

		expect(layout.pageWidth).toBe(210)
		expect(layout.pageHeight).toBe(297)
		expect(layout.boxX).toBe(10)
		expect(layout.boxWidth).toBe(190)
		expect(layout.boxHeight).toBe(277)
	})

	it("turns the paper on its side in landscape", () => {
		const layout = printLayout(DOC, setup({ orientation: "landscape" }))

		expect(layout.pageWidth).toBe(297)
		expect(layout.pageHeight).toBe(210)
	})

	it("shrinks a picture too wide for the box, keeping its proportions", () => {
		const layout = printLayout(DOC, setup())

		expect(layout.width).toBeCloseTo(190, 6)
		expect(layout.width / layout.height).toBeCloseTo(1152 / 648, 6)
	})

	it("never enlarges a picture that already fits", () => {
		const layout = printLayout({ width: 96, height: 96 }, setup())

		expect(layout.width).toBeCloseTo(25.4, 6)
	})

	it("prints at the picture's own size when fitting is off", () => {
		const layout = printLayout(DOC, setup({ fit: false }))

		expect(layout.width).toBeCloseTo(WIDE_MM, 6)
	})

	it("halves the picture at fifty percent", () => {
		const layout = printLayout(DOC, setup({ fit: false, scale: 50 }))

		expect(layout.width).toBeCloseTo(WIDE_MM / 2, 6)
	})

	it("centers only along the axes that ask for it", () => {
		const centered = printLayout(DOC, setup())
		const cornered = printLayout(DOC, setup({ centerH: false }))

		expect(centered.y).toBeCloseTo((277 - centered.height) / 2, 6)
		expect(cornered.x).toBe(0)
	})

	it("never pulls an oversized picture back off the corner", () => {
		const layout = printLayout(DOC, setup({ fit: false, scale: 400 }))

		expect(layout.x).toBe(0)
		expect(layout.y).toBe(0)
	})
})
