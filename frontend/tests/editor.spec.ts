import { expect, test, type Page } from "@playwright/test"
import {
	documentSize,
	openApp,
	openPicture,
	savePicture,
} from "./common"

/** the picture the flow starts from, built in the page rather than committed. */
const SOURCE = { width: 320, height: 240 }

/** the palette's red, which a swatch carries as its own label. */
const RED = "#ED1C24"

/** the box the crop leaves behind, in image pixels. */
const CROP = { x: 40, y: 30, w: 200, h: 150 }

/** a plain green rectangle, as the bytes a file input would hand over. */
async function sourceFile(page: Page): Promise<Buffer> {
	const base64 = await page.evaluate(async ({ width, height }) => {
		const canvas = document.createElement("canvas")
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext("2d")
		if (!ctx) throw new Error("no context")

		ctx.fillStyle = "#3f9c4f"
		ctx.fillRect(0, 0, width, height)
		return canvas.toDataURL("image/png").split(",")[1]
	}, SOURCE)

	return Buffer.from(base64, "base64")
}

/** a drag in image pixels, measured from the corner of the paper. */
async function dragOnCanvas(
	page: Page,
	from: { x: number; y: number },
	to: { x: number; y: number },
) {
	const box = await page.locator(".canvas__frame").boundingBox()
	if (!box) throw new Error("the paper is not on screen")

	await page.mouse.move(box.x + from.x, box.y + from.y)
	await page.mouse.down()
	await page.mouse.move(box.x + to.x, box.y + to.y, { steps: 12 })
	await page.mouse.up()
}

test("a picture survives crop, a shape, text and a round trip through png", async ({
	page,
}) => {
	await openApp(page)
	const source = await sourceFile(page)
	await openPicture(page, source, "source.png")
	await expect(documentSize(page)).toHaveText(
		`${SOURCE.width} x ${SOURCE.height}px`,
	)

	// crop down to a box drawn with the rectangular selection
	// the split button's top half is the tool, its bottom half the menu
	await page.locator(".ribbon-split__top[title='Select']").click()
	await dragOnCanvas(
		page,
		{ x: CROP.x, y: CROP.y },
		{ x: CROP.x + CROP.w, y: CROP.y + CROP.h },
	)
	await page.getByRole("button", { name: "Crop", exact: true }).click()
	await expect(documentSize(page)).toHaveText(`${CROP.w} x ${CROP.h}px`)

	// a red arrow across the middle
	await page.getByRole("button", { name: "Right arrow", exact: true }).click()
	await page.locator(`.colors__swatch[title="${RED}"]`).click()
	await dragOnCanvas(page, { x: 20, y: 40 }, { x: 160, y: 100 })

	// text, which the switch away from the tool bakes in
	await page.getByRole("button", { name: "Text", exact: true }).click()
	await dragOnCanvas(page, { x: 20, y: 110 }, { x: 150, y: 140 })
	await page.keyboard.type("hello")
	// an open box swaps the strip for the Text tab, and Home holds the tools
	await page.locator('.ribbon__tab-strip [role="tab"]').first().click()
	await page.getByRole("button", { name: "Pencil", exact: true }).click()

	const saved = await savePicture(page)
	expect(saved.length).toBeGreaterThan(0)

	// and open it again: the cropped size is what came back
	await openPicture(page, saved, "saved.png")
	await expect(documentSize(page)).toHaveText(`${CROP.w} x ${CROP.h}px`)
})
