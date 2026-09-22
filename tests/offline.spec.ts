import { expect, test, type Page } from "@playwright/test"

/** the hashed bundle, which is what a hand written precache list cannot name. */
const BUNDLE = /^\/assets\/index-.+\.js$/

/** the paths the worker holds, read back from the cache it filled. */
function cached(page: Page): Promise<string[]> {
	return page.evaluate(async () => {
		const names = await caches.keys()
		const paths: string[] = []

		for (const name of names) {
			const cache = await caches.open(name)
			const requests = await cache.keys()
			paths.push(...requests.map(request => new URL(request.url).pathname))
		}
		return paths
	})
}

/** the worker installs on the first load and claims the page from there. */
async function install(page: Page): Promise<void> {
	await page.goto("/")
	await page.evaluate(() => navigator.serviceWorker.ready)
	await expect(page.locator(".ribbon__content")).toBeVisible()
}

test("one visit is enough to precache the bundle", async ({ page }) => {
	await install(page)

	const paths = await cached(page)
	expect(paths).toContain("/")
	expect(paths.some(path => BUNDLE.test(path))).toBe(true)
})

test("a reload with the network off still opens the editor", async ({
	page,
	context,
}) => {
	await install(page)
	await context.setOffline(true)
	await page.reload()

	await expect(page.locator(".ribbon__content")).toBeVisible()
	await expect(page.locator(".canvas__surface").first()).toBeVisible()
})

test("a new tab opens offline after that one visit", async ({
	page,
	context,
}) => {
	await install(page)
	await context.setOffline(true)

	const second = await context.newPage()
	await second.goto("/")
	await expect(second.locator(".ribbon__content")).toBeVisible()
})
