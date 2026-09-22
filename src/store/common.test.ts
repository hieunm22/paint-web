import { describe, expect, it } from "vitest"
import { DEFAULT_DOCUMENT } from "common/constant"
import { parsePageSize } from "./common"

describe("parsePageSize", () => {
	it("takes a stored size back", () => {
		expect(parsePageSize({ width: 800, height: 600 })).toEqual({
			width: 800,
			height: 600,
		})
	})

	it("falls back when nothing was ever stored", () => {
		expect(parsePageSize(null)).toEqual(DEFAULT_DOCUMENT)
	})

	it("refuses a side the document could not have", () => {
		expect(parsePageSize({ width: 0, height: 600 })).toEqual(DEFAULT_DOCUMENT)
		expect(parsePageSize({ width: 800, height: 9000 })).toEqual(
			DEFAULT_DOCUMENT,
		)
		expect(parsePageSize({ width: 800.5, height: 600 })).toEqual(
			DEFAULT_DOCUMENT,
		)
		expect(parsePageSize({ width: "800", height: 600 })).toEqual(
			DEFAULT_DOCUMENT,
		)
	})
})
