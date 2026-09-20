import type { PickedFile, RecentEntry } from "types/common.types"
import type { ImageFormat } from "types/store.types"

export interface SaveOptions {
	/** overrides the document name, as the Save As dialog lets the user do. */
	fileName?: string
	/** jpeg and webp only, 0 to 1. */
	quality?: number
}

/** every File command in one object, shared by the backstage, QAT and dialogs. */
export interface FileCommands {
	newDocument(): void
	openDocument(): Promise<void>
	openPicked(picked: PickedFile): Promise<void>
	openRecent(entry: RecentEntry): Promise<void>
	/** false when the save did not happen, which cancels whatever waited on it. */
	save(): Promise<boolean>
	saveAs(format: ImageFormat, options?: SaveOptions): Promise<boolean>
	copyImage(): Promise<void>
	/** the selected pixels, or the whole picture when nothing is picked. */
	copySelection(): Promise<void>
	cutSelection(): Promise<void>
	pasteImage(): Promise<void>
	pasteBlob(blob: Blob): Promise<void>
	/** Paste from: a picture off disk, stamped like a clipboard paste. */
	pasteFrom(): Promise<void>
	exit(): void
	/** runs whatever the discard dialog was holding back. */
	resume(): void
	cancelPending(): void
}
