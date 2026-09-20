import { defineConfig, devices } from "@playwright/test"

const PORT = 3004

/**
 * visual regression only: the unit tests run in vitest under node, and these
 * need a real browser to paint the ribbon at all.
 */
export default defineConfig({
	testDir: "./tests",
	snapshotDir: "./tests/snapshots",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	reporter: process.env.CI ? "github" : "list",
	use: {
		baseURL: `http://localhost:${PORT}`,
		// the ribbon is a fixed strip, and a different window makes every
		// screenshot differ for reasons that have nothing to do with the code
		viewport: { width: 1280, height: 800 },
		deviceScaleFactor: 1,
	},
	expect: {
		// a tenth of a percent of a panel this size is some 900 pixels, which a
		// changed label slips under: the absolute count is what does the work
		toHaveScreenshot: { maxDiffPixels: 40, maxDiffPixelRatio: 0.001 },
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: "yarn dev",
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
})
