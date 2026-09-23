import { describe, expect, it } from "vitest"
import { DEFAULT_DOCUMENT, SETTINGS_DEFAULT } from "common/constant"
import { parsePageSize, parseSettings } from "./settings"

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

describe("parseSettings", () => {
	it("starts from the defaults where the key was never written", () => {
		expect(parseSettings(null)).toEqual(SETTINGS_DEFAULT)
	})

	it("starts from the defaults where the stored value is not an object", () => {
		expect(parseSettings("qat")).toEqual(SETTINGS_DEFAULT)
		expect(parseSettings(7)).toEqual(SETTINGS_DEFAULT)
	})

	it("takes a whole stored settings back", () => {
		const saved = {
			language: "vi",
			qat: ["undo", "save"],
			pageSize: { width: 800, height: 600 },
			thumbnailWidth: 420,
			view: { showRuler: true, showGrid: true, showStatusBar: false },
		}

		expect(parseSettings(saved)).toEqual({
			...saved,
			// the toolbar keeps its own order, not the order of the stored array
			qat: ["save", "undo"],
		})
	})

	it("loses only the field it cannot read", () => {
		const parsed = parseSettings({
			language: "de",
			qat: "all",
			pageSize: { width: 800, height: 600 },
			thumbnailWidth: -1,
			view: { showRuler: true, showGrid: "yes" },
		})

		expect(parsed).toEqual({
			...SETTINGS_DEFAULT,
			pageSize: { width: 800, height: 600 },
			view: { ...SETTINGS_DEFAULT.view, showRuler: true },
		})
	})
})
