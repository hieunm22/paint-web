import { describe, expect, it } from "vitest"
import { availableFonts } from "common/fonts"

const LISTED = ["Arial", "Calibri", "Verdana"]

describe("availableFonts", () => {
	/**
	 * a node run has no document to measure with. the fallback matters more
	 * than the measurement: a failed probe must not empty the font box.
	 */
	it("hands the whole list back when it cannot measure", () => {
		expect(availableFonts(LISTED)).toEqual(LISTED)
	})

	it("keeps an empty list empty", () => {
		expect(availableFonts([])).toEqual([])
	})
})
