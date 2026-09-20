import type { ImageFormat } from "types/store.types"

export type EmptyVoid = () => void
export type EmptyPromise = () => Promise<void>
export type NumberVoid = (n: number) => void

/** mime type to the extensions that spell it, as both pickers want it. */
export interface FilePickerType {
	description?: string
	accept: Record<string, string[]>
}

export interface OpenPickerOptions {
	types?: FilePickerType[]
	multiple?: boolean
	excludeAcceptAllOption?: boolean
}

export interface SavePickerOptions {
	suggestedName?: string
	types?: FilePickerType[]
}

/** the File System Access pickers, which lib.dom still does not declare. */
export interface FilePickerWindow {
	showOpenFilePicker(
		options?: OpenPickerOptions,
	): Promise<FileSystemFileHandle[]>
	showSaveFilePicker(options?: SavePickerOptions): Promise<FileSystemFileHandle>
}

/** one installed face, of which the font box reads only the family name. */
export interface LocalFontData {
	family: string
}

/** Chromium alone will name the installed fonts, and only once allowed to. */
export interface LocalFontWindow {
	queryLocalFonts(): Promise<LocalFontData[]>
}

export interface PermissionMode {
	mode: "read" | "readwrite"
}

/** the permission gate a stored handle has to pass before it reads again. */
export interface HandlePermission {
	queryPermission(mode: PermissionMode): Promise<PermissionState>
	requestPermission(mode: PermissionMode): Promise<PermissionState>
}

/** the files an installed app was opened with, which lib.dom does not declare. */
export interface LaunchParams {
	files: FileSystemFileHandle[]
}

export interface LaunchQueue {
	setConsumer(consumer: (params: LaunchParams) => void): void
}

export interface LaunchWindow {
	launchQueue?: LaunchQueue
}

/** Chrome hands a real handle over with a dropped item; nothing else does. */
export interface DroppedItem {
	getAsFileSystemHandle?(): Promise<FileSystemHandle | null>
}

/** a file the user chose, with the handle when the browser handed one over. */
export interface PickedFile {
	file: File
	handle: FileSystemFileHandle | null
}

/**
 * where the picture lands on one sheet, every measure in millimetres. the
 * offsets are counted from the corner of the printable box, not of the paper.
 */
export interface PrintLayout {
	pageWidth: number
	pageHeight: number
	/** corner of the printable box, which is where the margins put it. */
	boxX: number
	boxY: number
	boxWidth: number
	boxHeight: number
	width: number
	height: number
	x: number
	y: number
}

/** one row of the backstage recents list, as it sits in IndexedDB. */
export interface RecentEntry {
	/** the file name doubles as the key: opening it again replaces the row. */
	name: string
	format: ImageFormat
	openedAt: number
	/** 64 px png data url. */
	thumbnail: string
	/** absent on browsers whose picker hands back a plain File. */
	handle: FileSystemFileHandle | null
}
