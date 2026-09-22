import { expect, type Page } from "@playwright/test"

/** the language the app reads back on the next load. */
export const LANGUAGE_KEY = "language"

/**
 * the native pickers cannot be driven from a test, and the fallbacks they hide
 * can: a hidden file input on the way in, a download on the way out.
 */
export async function openApp(page: Page, language = "en"): Promise<void> {
	await page.addInitScript(
		([key, value]) => {
			window.localStorage.setItem(key, value)
			const host = window as unknown as Record<string, unknown>
			delete host.showOpenFilePicker
			delete host.showSaveFilePicker
		},
		[LANGUAGE_KEY, language],
	)
	await page.goto("/")
	await expect(page.locator(".ribbon__content")).toBeVisible()
	await page.evaluate(() => document.fonts.ready)
}

/**
 * macOS carries the standard commands on Cmd and every other platform on Ctrl,
 * and the app reads the user agent the browser sends rather than the host os.
 */
export function primaryKey(page: Page): Promise<string> {
	return page.evaluate(() =>
		/Mac|iPhone|iPad/.test(navigator.userAgent) ? "Meta" : "Control",
	)
}

/** the third status bar cell, which reads "<width> x <height>px". */
export function documentSize(page: Page) {
	return page.locator(".status-bar__cell").nth(2)
}

/** hands the app a picture the way a file input would. */
export async function openPicture(
	page: Page,
	file: Buffer,
	name: string,
): Promise<void> {
	const primary = await primaryKey(page)
	const chooser = page.waitForEvent("filechooser")
	await page.keyboard.press(`${primary}+o`)
	const picked = await chooser
	await picked.setFiles({ name, mimeType: "image/png", buffer: file })
}

/** saves through the download the app falls back to without a picker. */
export async function savePicture(page: Page): Promise<Buffer> {
	const download = page.waitForEvent("download")
	await page.keyboard.press(`${await primaryKey(page)}+s`)
	const saved = await (await download).path()
	const { readFile } = await import("node:fs/promises")
	return readFile(saved)
}

/** one pixel of a png, decoded in the page rather than by hand in node. */
export function pixelOf(
	page: Page,
	file: Buffer,
	x: number,
	y: number,
): Promise<number[]> {
	return page.evaluate(
		async ({ base64, at }) => {
			const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
			const bitmap = await createImageBitmap(new Blob([bytes]))
			const canvas = document.createElement("canvas")
			canvas.width = bitmap.width
			canvas.height = bitmap.height
			const ctx = canvas.getContext("2d")
			if (!ctx) throw new Error("no context")

			ctx.drawImage(bitmap, 0, 0)
			return [...ctx.getImageData(at.x, at.y, 1, 1).data]
		},
		{ base64: file.toString("base64"), at: { x, y } },
	)
}
