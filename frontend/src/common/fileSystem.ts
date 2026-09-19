import type { ImageFormat } from "store/types"
import type { FilePickerWindow, HandlePermission, PickedFile } from "./types"
import { acceptAnyImage, acceptFor, MIME_TYPES } from "./format"

/** Chrome and Edge have the pickers; Firefox and Safari take the fallbacks. */
const CAN_PICK_FILES = "showOpenFilePicker" in window
export const CAN_SAVE_IN_PLACE = "showSaveFilePicker" in window

function picker(): FilePickerWindow {
	return window as unknown as FilePickerWindow
}

/** dismissing a picker rejects; that is a choice, not a failure. */
function cancelled(error: unknown): boolean {
	return error instanceof DOMException && error.name === "AbortError"
}

/**
 * hidden input for browsers without a picker. the cancel event matters: the
 * promise would otherwise sit unsettled whenever the user backs out.
 */
function promptWithInput(): Promise<File | null> {
	return new Promise((resolve) => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = Object.values(MIME_TYPES).join(",")
		input.hidden = true

		const finish = (file: File | null) => {
			input.remove()
			resolve(file)
		}
		input.addEventListener("change", () => finish(input.files?.[0] ?? null))
		input.addEventListener("cancel", () => finish(null))

		document.body.append(input)
		input.click()
	})
}

/** null when the user dismissed the picker. */
export async function pickImageFile(): Promise<PickedFile | null> {
	if (!CAN_PICK_FILES) {
		const file = await promptWithInput()
		return file ? { file, handle: null } : null
	}

	try {
		const [handle] = await picker().showOpenFilePicker({
			types: [{ accept: acceptAnyImage() }],
			multiple: false,
		})
		return handle ? { file: await handle.getFile(), handle } : null
	} catch (error) {
		if (cancelled(error)) return null
		throw error
	}
}

/** null on a browser with no picker, and also when the user backs out. */
export async function pickSaveTarget(
	suggestedName: string,
	format: ImageFormat,
): Promise<FileSystemFileHandle | null> {
	if (!CAN_SAVE_IN_PLACE) return null

	try {
		return await picker().showSaveFilePicker({
			suggestedName,
			types: [{ accept: acceptFor(format) }],
		})
	} catch (error) {
		if (cancelled(error)) return null
		throw error
	}
}

export async function writeFile(
	handle: FileSystemFileHandle,
	blob: Blob,
): Promise<void> {
	const writable = await handle.createWritable()
	await writable.write(blob)
	await writable.close()
}

/** the fallback save: the file lands in the browser's download folder. */
export function downloadBlob(blob: Blob, name: string): void {
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = name
	link.click()

	// revoking straight away cuts the download short in Safari
	window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/**
 * a handle kept from an earlier session needs its permission renewed, and the
 * request only succeeds inside a user gesture.
 */
export async function ensurePermission(
	handle: FileSystemFileHandle,
	mode: "read" | "readwrite",
): Promise<boolean> {
	const gate = handle as unknown as Partial<HandlePermission>
	if (!gate.queryPermission || !gate.requestPermission) return true

	if ((await gate.queryPermission({ mode })) === "granted") return true
	return (await gate.requestPermission({ mode })) === "granted"
}
