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
	const base = { key: "n", ctrlKey: false, metaKey: false, altKey: false }
	return { ...base, ...init } as KeyboardEvent
}

afterEach(() => {
	vi.unstubAllGlobals()
})

describe("formatShortcut", () => {
	it("spells the primary modifier Ctrl on Windows", async () => {
		const format = await formatterFor(WINDOWS)

		expect(format("Mod+O")).toBe("Ctrl+O")
		expect(format("Mod+PgUp")).toBe("Ctrl+PgUp")
		expect(format("Del")).toBe("Del")
	})

	it("keeps a literal Ctrl shortcut on Windows", async () => {
		const format = await formatterFor(WINDOWS)

		expect(format("Ctrl+R")).toBe("Ctrl+R")
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
		expect(await (await formatterFor(MAC))("F11")).toBe("F11")
		expect(await (await formatterFor(WINDOWS))("F11")).toBe("F11")
	})
})

describe("isNewDocumentKey", () => {
	it("answers Control+N on macOS, where Cmd+N is the browser's", async () => {
		const { isNewDocumentKey } = await platformFor(MAC)

		expect(isNewDocumentKey(keyEvent({ ctrlKey: true }))).toBe(true)
		expect(isNewDocumentKey(keyEvent({ metaKey: true }))).toBe(false)
		expect(isNewDocumentKey(keyEvent({ ctrlKey: true, altKey: true }))).toBe(
			false,
		)
	})

	it("answers Ctrl+Alt+N on Windows, where Ctrl+N is the browser's", async () => {
		const { isNewDocumentKey } = await platformFor(WINDOWS)

		expect(isNewDocumentKey(keyEvent({ ctrlKey: true, altKey: true }))).toBe(
			true,
		)
		expect(isNewDocumentKey(keyEvent({ ctrlKey: true }))).toBe(false)
	})

	it("ignores every other letter", async () => {
		const { isNewDocumentKey } = await platformFor(MAC)

		expect(isNewDocumentKey(keyEvent({ key: "m", ctrlKey: true }))).toBe(false)
	})
})
