import { expect, test, type Page } from "@playwright/test"

/** the language the app reads back on the next load. */
const STORAGE_KEY = "language"

const LANGUAGES = ["en", "vi"] as const

/** the tabs the strip carries without a text box open. */
const TABS = ["home", "view"] as const

async function openApp(page: Page, language: string): Promise<void> {
	await page.addInitScript(
		([key, value]) => window.localStorage.setItem(key, value),
		[STORAGE_KEY, language],
	)
	await page.goto("/")
	await expect(page.locator(".ribbon__content")).toBeVisible()
	// the icon webfont lands after the first paint and shifts every glyph
	await page.evaluate(() => document.fonts.ready)
}

for (const language of LANGUAGES) {
	test.describe(`ribbon in ${language}`, () => {
		for (const tab of TABS) {
			test(`the ${tab} tab looks as it did`, async ({ page }) => {
				await openApp(page, language)
				await page.locator(`.ribbon__tab-strip [role="tab"]`).nth(
					TABS.indexOf(tab),
				).click()

				await expect(page.locator(".ribbon__content")).toHaveScreenshot(
					`ribbon-${tab}-${language}.png`,
				)
			})
		}

		test("the file backstage looks as it did", async ({ page }) => {
			await openApp(page, language)
			await page.locator(".ribbon__tab--file").click()

			await expect(page.locator(".file-menu")).toHaveScreenshot(
				`backstage-${language}.png`,
			)
		})
	})
}
