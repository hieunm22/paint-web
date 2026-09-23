import {
	afterEach,
	describe,
	expect,
	it,
	vi,
} from "vitest"

const MAC = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
const WINDOWS = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"

// IS_MAC is read once at import, so each platform needs a fresh module graph
async function platformFor(userAgent: string) {
	vi.resetModules()
	vi.stubGlobal("navigator", { userAgent })
	return import("common/platform")
}

async function formatterFor(userAgent: string) {
	const { formatShortcut } = await platformFor(userAgent)
	return formatShortcut
}

function keyEvent(init: Partial<KeyboardEvent>) {
	const base = {
		key: "n",
		ctrlKey: false,
		metaKey: false,
		altKey: false,
		shiftKey: false,
	}
	return { ...base, ...init } as KeyboardEvent
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe("formatShortcut", () => {
	it("spells the primary modifier Ctrl on Windows", async () => {
		const format = await formatterFor(WINDOWS)

		expect(format("Mod+O")).toBe("Ctrl+O")
		expect(format("Del")).toBe("Del")
	})

	it("keeps a literal Ctrl shortcut on Windows", async () => {
		const format = await formatterFor(WINDOWS)

		expect(format("Ctrl+E")).toBe("Ctrl+E")
	})

	it("hands the keys Windows reserves an Alt of their own", async () => {
		const format = await formatterFor(WINDOWS)

		expect(format("Ctrl+R")).toBe("Ctrl + Alt + R")
		expect(format("Ctrl+W")).toBe("Ctrl + Alt + W")
		expect(format("Mod+PgUp")).toBe("Ctrl + Alt + PgUp")
	})

	it("leaves those same keys alone on macOS", async () => {
		const format = await formatterFor(MAC)

		expect(format("Ctrl+R")).toBe("\u2303R")
		expect(format("Ctrl+W")).toBe("\u2303W")
	})

	it("moves full screen off F11 on macOS, where Mission Control has it", async () => {
		expect(await (await formatterFor(MAC))("F11")).toBe("\u21e7 + \u2318 + F")
		expect(await (await formatterFor(WINDOWS))("F11")).toBe("F11")
	})

	it("marks the macOS keys with the symbols on the keyboard", async () => {
		const format = await formatterFor(MAC)

		expect(format("Mod+O")).toBe("⌘O")
		expect(format("Del")).toBe("⌦")
	})

	it("marks control for the keys Paint owns alone", async () => {
		const format = await formatterFor(MAC)

		expect(format("Ctrl+R")).toBe("⌃R")
		expect(format("Ctrl+G")).toBe("⌃G")
	})

	it("spaces out a combination of three keys or more", async () => {
		expect(await (await formatterFor(MAC))("Mod+Shift+S")).toBe("⇧ + ⌘ + S")
		expect(await (await formatterFor(WINDOWS))("Mod+Shift+S")).toBe(
			"Ctrl + Shift + S",
		)
	})

	it("counts a macOS page key as the two keys it takes", async () => {
		expect(await (await formatterFor(MAC))("Mod+PgUp")).toBe("⌘ + fn + ↑")
		expect(await (await formatterFor(MAC))("Mod+PgDn")).toBe("⌘ + fn + ↓")
	})

	it("moves New onto the key the platform leaves free", async () => {
		expect(await (await formatterFor(WINDOWS))("Mod+N")).toBe("Ctrl + Alt + N")
		expect(await (await formatterFor(MAC))("Mod+N")).toBe("⌃N")
	})

	it("passes an unmapped key straight through", async () => {
		expect(await (await formatterFor(MAC))("Enter")).toBe("Enter")
		expect(await (await formatterFor(WINDOWS))("Enter")).toBe("Enter")
	})
})

describe("isReservedCtrlKey", () => {
	it("answers plain Control on macOS, where the browser's key is Cmd", async () => {
		const { isReservedCtrlKey } = await platformFor(MAC)

		expect(isReservedCtrlKey(keyEvent({ ctrlKey: true }), "n")).toBe(true)
		expect(isReservedCtrlKey(keyEvent({ metaKey: true }), "n")).toBe(false)
		expect(
			isReservedCtrlKey(keyEvent({ ctrlKey: true, altKey: true }), "n"),
		).toBe(false)
	})

	it("asks for Alt as well on Windows, where the browser keeps Ctrl", async () => {
		const { isReservedCtrlKey } = await platformFor(WINDOWS)

		expect(
			isReservedCtrlKey(
				keyEvent({ key: "w", ctrlKey: true, altKey: true }),
				"w",
			),
		).toBe(true)
		expect(isReservedCtrlKey(keyEvent({ key: "w", ctrlKey: true }), "w")).toBe(
			false,
		)
	})

	it("ignores every other letter", async () => {
		const { isReservedCtrlKey } = await platformFor(MAC)

		expect(isReservedCtrlKey(keyEvent({ key: "m", ctrlKey: true }), "n")).toBe(
			false,
		)
	})
})

describe("isZoomKey", () => {
	it("takes the primary modifier alone on macOS", async () => {
		const { isZoomKey } = await platformFor(MAC)

		expect(isZoomKey(keyEvent({ key: "PageUp", metaKey: true }))).toBe(true)
		expect(isZoomKey(keyEvent({ key: "PageUp" }))).toBe(false)
	})

	it("asks for Alt on Windows, where Ctrl+PageUp changes tab", async () => {
		const { isZoomKey } = await platformFor(WINDOWS)

		expect(
			isZoomKey(keyEvent({ key: "PageDown", ctrlKey: true, altKey: true })),
		).toBe(true)
		expect(isZoomKey(keyEvent({ key: "PageDown", ctrlKey: true }))).toBe(false)
	})
})

describe("isFullScreenKey", () => {
	it("answers F11 on either platform", async () => {
		expect(
			(await platformFor(WINDOWS)).isFullScreenKey(keyEvent({ key: "F11" })),
		).toBe(true)
		expect(
			(await platformFor(MAC)).isFullScreenKey(keyEvent({ key: "F11" })),
		).toBe(true)
	})

	it("answers Cmd+Shift+F on macOS alone", async () => {
		const held = keyEvent({ key: "f", metaKey: true, shiftKey: true })

		expect((await platformFor(MAC)).isFullScreenKey(held)).toBe(true)
		expect((await platformFor(WINDOWS)).isFullScreenKey(held)).toBe(false)
	})
})
