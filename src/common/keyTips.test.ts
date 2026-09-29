import { describe, expect, it } from "vitest"
import {
	assignKeyTips,
	keyTipChar,
	keyTipLetters,
	placeKeyTip,
} from "common/keyTips"

const RIBBON = { left: 0, top: 0, right: 800, bottom: 90 }

describe("keyTipLetters", () => {
	it("drops marks, spaces and punctuation", () => {
		expect(keyTipLetters("Xoay phải 90°")).toBe("XOAYPHAI90")
		expect(keyTipLetters("Đảo vùng chọn")).toBe("DAOVUNGCHON")
		expect(keyTipLetters("Paste from...")).toBe("PASTEFROM")
	})
})

describe("assignKeyTips", () => {
	it("keeps a tip of its own and draws the rest from their labels", () => {
		const tips = assignKeyTips([
			{ keys: "SE", label: "Select", disabled: false },
			{ keys: null, label: "Rotate right", disabled: false },
			{ keys: null, label: "Rotate left", disabled: false },
		])

		expect(tips).toEqual(["SE", "R", "O"])
	})

	it("never hands out a letter another tip starts with", () => {
		const tips = assignKeyTips([
			{ keys: "SE", label: "Select", disabled: false },
			{ keys: null, label: "Save", disabled: false },
		])

		expect(tips[1]).toBe("A")
	})

	it("leaves a disabled control without an automatic tip", () => {
		const tips = assignKeyTips([
			{ keys: null, label: "Delete", disabled: true },
			{ keys: null, label: "Delete", disabled: false },
		])

		expect(tips).toEqual([null, "D"])
	})

	it("falls back to the pool once a label has no free letter", () => {
		const tips = assignKeyTips([
			{ keys: null, label: "A", disabled: false },
			{ keys: null, label: "A", disabled: false },
		])

		expect(tips).toEqual(["A", "B"])
	})
})

describe("keyTipChar", () => {
	it("reads letters and digits in upper case", () => {
		expect(keyTipChar({ key: "s", code: "KeyS" })).toBe("S")
		expect(keyTipChar({ key: "1", code: "Digit1" })).toBe("1")
	})

	it("falls back to the physical key on a non-latin layout", () => {
		expect(keyTipChar({ key: "ы", code: "KeyS" })).toBe("S")
	})

	it("ignores keys no tip is made of", () => {
		expect(keyTipChar({ key: "Enter", code: "Enter" })).toBeNull()
		expect(keyTipChar({ key: "ArrowDown", code: "ArrowDown" })).toBeNull()
	})
})

describe("placeKeyTip", () => {
	it("puts a large button's tip on its bottom edge", () => {
		const box = { left: 10, top: 2, right: 50, bottom: 70 }

		expect(placeKeyTip("tab", box, RIBBON)).toEqual({ left: 30, top: 70 })
	})

	it("puts a small button's tip over its icon on the edge facing out", () => {
		const top = { left: 100, top: 2, right: 160, bottom: 24 }
		const middle = { left: 100, top: 26, right: 160, bottom: 48 }

		expect(placeKeyTip("tab", top, RIBBON)).toEqual({ left: 114, top: 2 })
		expect(placeKeyTip("tab", middle, RIBBON)).toEqual({ left: 114, top: 37 })
	})

	it("centers a tab's tip under it", () => {
		const box = { left: 0, top: 0, right: 60, bottom: 24 }

		expect(placeKeyTip("root", box, box)).toEqual({ left: 30, top: 24 })
	})

	it("sets a menu item's tip on its row", () => {
		const box = { left: 0, top: 100, right: 200, bottom: 122 }

		expect(placeKeyTip("menu", box, box)).toEqual({ left: 14, top: 111 })
	})
})
