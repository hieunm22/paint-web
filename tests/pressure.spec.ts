import { expect, test, type CDPSession, type Page } from "@playwright/test"

/** where the two strokes are drawn, in pixels down from the top of the paper. */
const LIGHT_ROW = 60
const HEAVY_ROW = 140

/** the span a stroke crosses, and the step between two samples. */
const FROM_X = 40
const TO_X = 240
const STEP = 10

/** the band read back around a stroke, tall enough to hold the widest nib. */
const BAND = 12

/** playwright's protocol types do not carry the pen fields of a mouse event. */
type PenEvent = Parameters<CDPSession["send"]>[1] & {
	pointerType: string
	force: number
}

/** one stroke drawn straight across the paper at a fixed force. */
async function strokeAt(page: Page, y: number, force: number) {
	const box = await page.locator(".canvas__frame").boundingBox()
	if (!box) throw new Error("the paper is not on screen")

	const cdp = await page.context().newCDPSession(page)
	const at = (type: string, x: number) =>
		cdp.send("Input.dispatchMouseEvent", {
			type,
			x: box.x + x,
			y: box.y + y,
			button: "left",
			buttons: 1,
			pointerType: "pen",
			force,
		} as PenEvent)

	await at("mousePressed", FROM_X)
	for (let x = FROM_X + STEP; x <= TO_X; x += STEP) await at("mouseMoved", x)
	await at("mouseReleased", TO_X)
}

/** how much ink the band around one stroke carries. */
async function inkAt(page: Page, y: number) {
	return page.evaluate(
		([top, from, to, height]) => {
			const canvas = document.querySelector("canvas") as HTMLCanvasElement
			const ctx = canvas.getContext("2d")
			if (!ctx) throw new Error("the paper has no context")

			const pixels = ctx.getImageData(from, top - height / 2, to - from, height)
			let ink = 0
			for (let i = 0; i < pixels.data.length; i += 4) {
				ink += 255 - pixels.data[i]
			}

			return ink
		},
		[y, FROM_X, TO_X, BAND],
	)
}

/** the gallery behind the split button, where the nine brushes live. */
async function pickBrush(page: Page, name: string) {
	await page
		.locator(".ribbon-split", { has: page.getByTitle("Brushes") })
		.locator(".ribbon-split__bottom")
		.click()
	await page.locator(`.brush-gallery__cell[title="${name}"]`).click()
}

test("a pen's force reaches the natural pencil", async ({ page }) => {
	await page.goto("/")
	await page.waitForSelector(".canvas__frame")
	await pickBrush(page, "Natural pencil")

	await strokeAt(page, LIGHT_ROW, 0.1)
	await strokeAt(page, HEAVY_ROW, 1)

	const light = await inkAt(page, LIGHT_ROW)
	const heavy = await inkAt(page, HEAVY_ROW)

	expect(light).toBeGreaterThan(0)
	expect(heavy).toBeGreaterThan(light * 1.5)
})

test("a pen's force leaves the plain brush alone", async ({ page }) => {
	await page.goto("/")
	await page.waitForSelector(".canvas__frame")
	await pickBrush(page, "Brush")

	await strokeAt(page, LIGHT_ROW, 0.1)
	await strokeAt(page, HEAVY_ROW, 1)

	const light = await inkAt(page, LIGHT_ROW)
	const heavy = await inkAt(page, HEAVY_ROW)

	expect(light).toBeGreaterThan(0)
	expect(heavy).toBeCloseTo(light, -2)
})
