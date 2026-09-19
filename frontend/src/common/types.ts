import type { ImageFormat } from "store/types"

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

export interface PermissionMode {
	mode: "read" | "readwrite"
}

/** the permission gate a stored handle has to pass before it reads again. */
export interface HandlePermission {
	queryPermission(mode: PermissionMode): Promise<PermissionState>
	requestPermission(mode: PermissionMode): Promise<PermissionState>
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
