import { defineConfig, devices } from "@playwright/test"

const PORT = 3005

/**
 * its own config: the worker is registered only in a built app, and the dev
 * server the other specs run against never produces one.
 */
export default defineConfig({
	testDir: "./tests",
	testMatch: "**/offline.spec.ts",
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	reporter: process.env.CI ? "github" : "list",
	use: {
		...devices["Desktop Chrome"],
		baseURL: `http://localhost:${PORT}`,
	},
	webServer: {
		command: `yarn preview --port ${PORT}`,
		url: `http://localhost:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
})
