import { expect, test, type Page } from "@playwright/test"
import {
	documentSize,
	openApp,
	openPicture,
	pixelOf,
	savePicture,
} from "./common"

/** the page a fresh app opens with. */
const PAGE = { width: 1152, height: 648 }

/** the palette's red, which a swatch carries as its own label. */
const RED = "#ED1C24"

/** a picture past the side the windowed renderer takes over at. */
const WIDE = { width: 4800, height: 400 }

/** where the pencil is put down, in image pixels. */
const TARGET = { x: 260, y: 150 }

/** the bitmap of the layer the picture is drawn onto, in device pixels. */
function surfaceBitmap(page: Page): Promise<{ width: number; height: number }> {
	return page.locator(".canvas__surface").first().evaluate(el => {
		const canvas = el as HTMLCanvasElement
		return { width: canvas.width, height: canvas.height }
	})
}

/** steps the status bar zoom up to the asked-for level. */
async function zoomTo(page: Page, percent: number): Promise<void> {
	const label = page.locator(".status-bar__zoom-label")
	const button = page.getByRole("button", { name: "Zoom in", exact: true })

	while ((await label.innerText()) !== `${percent}%`) await button.click()
}

/** presses the pencil down on one image pixel and lifts it again. */
async function dotAt(page: Page, at: { x: number; y: number }, zoom: number) {
	const frame = await page.locator(".canvas__frame").boundingBox()
	if (!frame) throw new Error("the paper is not on screen")

	// the middle of the pixel, which a floor at the edge would round elsewhere
	const x = frame.x + (at.x + 0.5) * zoom
	const y = frame.y + (at.y + 0.5) * zoom
	await page.mouse.move(x, y)
	await page.mouse.down()
	await page.mouse.up()
}

test("a deep zoom keeps the picture layer down to what the viewport shows", async ({
	page,
}) => {
	await openApp(page)

	const whole = await surfaceBitmap(page)
	expect(whole).toEqual(PAGE)

	await zoomTo(page, 800)
	const windowed = await surfaceBitmap(page)

	// the whole page at 800% would be 9216 by 5184; a window is viewport sized
	expect(windowed.width).toBeLessThan(PAGE.width * 8)
	expect(windowed.height).toBeLessThan(PAGE.height * 8)
})

test("a picture wider than the limit is windowed at any zoom", async ({
	page,
}) => {
	await openApp(page)
	const base64 = await page.evaluate(async ({ width, height }) => {
		const canvas = document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		canvas.getContext("2d")?.fillRect(0, 0, 1, 1)
		return canvas.toDataURL("image/png").split(",")[1]
	}, WIDE)

	await openPicture(page, Buffer.from(base64, "base64"), "wide.png")
	await expect(documentSize(page)).toHaveText(
		`${WIDE.width} x ${WIDE.height}px`,
	)

	// at 100% the paper alone would be 4800 pixels of canvas in the dom
	const windowed = await surfaceBitmap(page)
	expect(windowed.width).toBeLessThan(WIDE.width)
})

test("a stroke through the window lands on the pixel under the pointer", async ({
	page,
}) => {
	await openApp(page)
	await page.getByRole("button", { name: "Pencil", exact: true }).click()
	await page.locator(`.colors__swatch[title="${RED}"]`).click()
	await zoomTo(page, 800)

	// scroll far enough in that the window holds neither corner of the paper
	await page.locator(".canvas__viewport").evaluate(el => {
		el.scrollLeft = 1400
		el.scrollTop = 900
	})
	await dotAt(page, TARGET, 8)

	const saved = await savePicture(page)
	const [r, g, b] = await pixelOf(page, saved, TARGET.x, TARGET.y)
	expect([r, g, b]).toEqual([237, 28, 36])

	const elsewhere = await pixelOf(page, saved, TARGET.x + 40, TARGET.y + 40)
	expect(elsewhere.slice(0, 3)).toEqual([255, 255, 255])
})
