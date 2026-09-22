import { expect, test, type Page } from "@playwright/test"
import { documentSize, openApp } from "./common"

/**
 * a real drag cannot be driven from a test, and the events it fires can. the
 * transfer is built once per page so the same file rides every event.
 */
async function dragFile(
	page: Page,
	kind: "image" | "text" | "two-images",
	events: string[],
): Promise<void> {
	await page.evaluate(
		async ([kind, events]: [string, string[]]) => {
			const picture = async (name: string) => {
				const canvas = document.createElement("canvas")
				canvas.width = 40
				canvas.height = 25
				const blob = await new Promise<Blob>(resolve =>
					canvas.toBlob(b => resolve(b!), "image/png"),
				)
				return new File([blob], name, { type: "image/png" })
			}

			const host = window as unknown as Record<string, unknown>
			if (!host.dropData) {
				const data = new DataTransfer()
				if (kind === "text") {
					data.items.add(new File(["hi"], "notes.txt", { type: "text/plain" }))
				} else {
					data.items.add(await picture("drop.png"))
					if (kind === "two-images") data.items.add(await picture("other.png"))
				}
				host.dropData = data
			}

			const data = host.dropData as DataTransfer
			const target = document.querySelector(".canvas__frame")!
			for (const type of events) {
				target.dispatchEvent(
					new DragEvent(type, {
						bubbles: true,
						cancelable: true,
						dataTransfer: data,
					}),
				)
			}
		},
		[kind, events] as [string, string[]],
	)
}

test("a picture dragged over the window is offered, then opened", async ({
	page,
}) => {
	await openApp(page)
	const overlay = page.locator(".drop-overlay")
	await expect(overlay).toBeHidden()

	await dragFile(page, "image", ["dragenter", "dragover"])
	await expect(overlay).toBeVisible()
	await expect(overlay).toHaveText("Drop a picture here to open it")

	// carrying the file back out of the window puts the overlay away again
	await dragFile(page, "image", ["dragleave"])
	await expect(overlay).toBeHidden()

	await dragFile(page, "image", ["dragenter", "dragover", "drop"])
	await expect(overlay).toBeHidden()
	await expect(documentSize(page)).toHaveText("40 x 25px")
})

test("a file that is not a picture says so and keeps the page", async ({
	page,
}) => {
	await openApp(page)
	await dragFile(page, "text", ["dragenter", "dragover", "drop"])

	await expect(page.locator(".toast__text")).toHaveText(
		"That file is not a picture",
	)
	await expect(page.locator(".drop-overlay")).toBeHidden()
	await expect(documentSize(page)).toHaveText("1152 x 648px")
})

test("a drop of several pictures opens the first and says so", async ({
	page,
}) => {
	await openApp(page)
	await dragFile(page, "two-images", ["dragenter", "dragover", "drop"])

	await expect(page.locator(".toast__text")).toHaveText(
		"Only the first picture was opened - Paint holds one at a time",
	)
	await expect(documentSize(page)).toHaveText("40 x 25px")
})
