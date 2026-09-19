import type { PickedFile } from "./types"

/**
 * the file state the store cannot hold. a FileSystemFileHandle and a File are
 * not serializable, and nothing renders from either one.
 */
let active: FileSystemFileHandle | null = null
let deferred: PickedFile | null = null

/** present when Save can overwrite rather than download. */
export function activeHandle(): FileSystemFileHandle | null {
	return active
}

export function setActiveHandle(handle: FileSystemFileHandle | null): void {
	active = handle
}

/** parks an open while the discard dialog asks about unsaved work. */
export function deferOpen(picked: PickedFile): void {
	deferred = picked
}

/** hands the parked open over once, and forgets it either way. */
export function takeDeferredOpen(): PickedFile | null {
	const picked = deferred
	deferred = null
	return picked
}
