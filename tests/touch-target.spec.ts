import { expect, test, type Page } from "@playwright/test"

/** the handle on the right edge, the only one on screen at the default size. */
const HANDLE = ".canvas__handle--e"

/** what a hit on the handle reads as, pseudo-element or not. */
const HANDLE_CLASS = "canvas__handle"

/** offsets from the middle of the handle, across the edge of the paper. */
const INSIDE = -12
const NEAR = 12
const FAR = 22
const PAST = 30

/** the lift that shows the target grew along the edge as well. */
const ABOVE = -16

/** the class name of whatever lies under a point measured from the handle. */
async function hitAt(page: Page, dx: number, dy = 0) {
	const box = await page.locator(HANDLE).boundingBox()
	if (!box) throw new Error("the handle is not on screen")

	return page.evaluate(
		([x, y]) => {
			const el = document.elementFromPoint(x, y)
			return el instanceof HTMLElement ? el.className : ""
		},
		[box.x + box.width / 2 + dx, box.y + box.height / 2 + dy],
	)
}

async function openPaper(page: Page) {
	await page.goto("/")
	await page.waitForSelector(".canvas__frame")
}

/** the media query the whole widening hangs on. */
async function isCoarse(page: Page) {
	return page.evaluate(() => matchMedia("(pointer: coarse)").matches)
}

test.describe("a mouse", () => {
	test.use({ hasTouch: false })

	test("leaves the resize handle at its own five pixels", async ({ page }) => {
		await openPaper(page)
		expect(await isCoarse(page)).toBe(false)

		expect(await hitAt(page, 0)).toContain(HANDLE_CLASS)
		expect(await hitAt(page, NEAR)).not.toContain(HANDLE_CLASS)
		expect(await hitAt(page, FAR)).not.toContain(HANDLE_CLASS)
		expect(await hitAt(page, 0, ABOVE)).not.toContain(HANDLE_CLASS)
	})
})

test.describe("a finger", () => {
	test.use({ hasTouch: true })

	test("reaches the resize handle from further out", async ({ page }) => {
		await openPaper(page)
		expect(await isCoarse(page)).toBe(true)

		expect(await hitAt(page, 0)).toContain(HANDLE_CLASS)
		expect(await hitAt(page, NEAR)).toContain(HANDLE_CLASS)
		expect(await hitAt(page, FAR)).toContain(HANDLE_CLASS)
		expect(await hitAt(page, 0, ABOVE)).toContain(HANDLE_CLASS)
	})

	test("does not take a touch meant for the picture", async ({ page }) => {
		await openPaper(page)

		// the target grows away from the paper: a stroke along the right edge
		// must still reach the canvas
		expect(await hitAt(page, INSIDE)).not.toContain(HANDLE_CLASS)
		expect(await hitAt(page, PAST)).not.toContain(HANDLE_CLASS)
	})
})
