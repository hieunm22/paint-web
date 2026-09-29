import { expect, test, type Page } from "@playwright/test"
import { openApp } from "./common"

/** the letters on screen, in the order the layer lists its controls. */
function tips(page: Page) {
	return page.locator(".key-tips__tip")
}

/** Alt pressed and released alone, which is what shows the tips. */
async function tapAlt(page: Page) {
	await page.keyboard.press("Alt")
}

test.beforeEach(async ({ page }) => {
	await openApp(page)
})

test("Alt shows the tab strip and the quick access bar", async ({ page }) => {
	await tapAlt(page)

	await expect(tips(page)).toHaveText(["1", "2", "3", "F", "H", "V"])

	await tapAlt(page)
	await expect(tips(page)).toHaveCount(0)
})

test("a tab's letter opens its controls, and two letters pick a tool", async ({
	page,
}) => {
	const pencil = page.getByRole("button", { name: "Pencil" })

	await tapAlt(page)
	await page.keyboard.press("h")
	await expect(tips(page).filter({ hasText: /^P1$/ })).toBeVisible()

	// the first letter narrows the tips to the ones it starts
	await page.keyboard.press("p")
	await expect(tips(page)).toHaveText(["P1"])

	await page.keyboard.press("1")
	await expect(pencil).toHaveAttribute("aria-pressed", "true")
	await expect(tips(page)).toHaveCount(0)
})

test("Escape steps back one level at a time", async ({ page }) => {
	await tapAlt(page)
	await page.keyboard.press("v")
	await expect(page.getByRole("tab", { name: "View" })).toHaveAttribute(
		"aria-selected",
		"true",
	)
	await expect(tips(page).filter({ hasText: /^G$/ })).toBeVisible()

	await page.keyboard.press("Escape")
	await expect(tips(page)).toHaveText(["1", "2", "3", "F", "H", "V"])

	await page.keyboard.press("Escape")
	await expect(tips(page)).toHaveCount(0)
})

test("keys typed ahead of a render still land in order", async ({ page }) => {
	await tapAlt(page)
	for (const key of ["h", "s", "e", "Escape", "Escape", "v"]) {
		await page.keyboard.press(key)
	}

	await expect(page.getByRole("tab", { name: "View" })).toHaveAttribute(
		"aria-selected",
		"true",
	)
	await expect(tips(page).filter({ hasText: /^G$/ })).toBeVisible()
})

test("a menu opened from a tip carries tips of its own", async ({ page }) => {
	await tapAlt(page)
	await page.keyboard.press("h")
	await page.keyboard.press("r")
	await page.keyboard.press("o")

	const menu = page.getByRole("menu")
	await expect(menu).toBeVisible()
	await expect(tips(page)).toHaveCount(5)

	await page.keyboard.press("Escape")
	await expect(menu).toHaveCount(0)
	await expect(tips(page).filter({ hasText: /^RO$/ })).toBeVisible()
})

test("File opens the backstage with its rows lettered", async ({ page }) => {
	await tapAlt(page)
	await page.keyboard.press("f")

	await expect(page.locator(".file-menu")).toBeVisible()
	await expect(tips(page).filter({ hasText: /^X$/ })).toBeVisible()

	await page.keyboard.press("Escape")
	await expect(page.locator(".file-menu")).toHaveCount(0)
	await expect(tips(page).filter({ hasText: /^H$/ })).toBeVisible()
})

test("a click anywhere puts the tips away", async ({ page }) => {
	await tapAlt(page)
	await expect(tips(page)).not.toHaveCount(0)

	await page.mouse.click(640, 500)
	await expect(tips(page)).toHaveCount(0)
})
