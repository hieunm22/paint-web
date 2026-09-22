import { expect, test, type Page } from "@playwright/test"
import { openApp, openPicture } from "./common"

/** the picture the stroke is drawn on, big enough to matter. */
const CANVAS = { width: 2000, height: 2000 }

/** positions fed through the canvas in one continuous drag. */
const POINTS = 500

/** two display frames: past this the hand visibly outruns the ink. */
const BUDGET_MS = 32

/** the first frames carry the layout the stroke did not cause. */
const WARMUP = 5

/** records when the browser actually painted, from the page's own clock. */
async function watchFrames(page: Page): Promise<void> {
	await page.evaluate(() => {
		const host = window as unknown as { frames?: number[] }
		host.frames = []
		const tick = (at: number) => {
			host.frames?.push(at)
			requestAnimationFrame(tick)
		}
		requestAnimationFrame(tick)
	})
}

/** the gaps between paints, in milliseconds. */
async function frameGaps(page: Page): Promise<number[]> {
	return page.evaluate(() => {
		const host = window as unknown as { frames?: number[] }
		const marks = host.frames ?? []
		return marks.slice(1).map((at, i) => at - marks[i])
	})
}

test("a long stroke on a large picture drops no frame", async ({ page }) => {
	await openApp(page)

	const base64 = await page.evaluate(async ({ width, height }) => {
		const canvas = document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		canvas.getContext("2d")?.fillRect(0, 0, 1, 1)
		return canvas.toDataURL("image/png").split(",")[1]
	}, CANVAS)
	await openPicture(page, Buffer.from(base64, "base64"), "large.png")

	await page.getByRole("button", { name: "Pencil", exact: true }).click()
	const frame = await page.locator(".canvas__frame").boundingBox()
	if (!frame) throw new Error("the paper is not on screen")

	await watchFrames(page)
	await page.mouse.move(frame.x + 20, frame.y + 20)
	await page.mouse.down()
	await page.mouse.move(frame.x + 700, frame.y + 500, { steps: POINTS })
	await page.mouse.up()

	const gaps = await frameGaps(page)
	const measured = gaps.slice(WARMUP)
	expect(measured.length).toBeGreaterThan(POINTS / 10)
	expect(Math.max(...measured)).toBeLessThanOrEqual(BUDGET_MS)
})
