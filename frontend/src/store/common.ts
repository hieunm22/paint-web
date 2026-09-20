import {
	DEFAULT_DOCUMENT,
	MAX_DIMENSION,
	PAGE_SIZE_STORAGE_KEY,
	QAT_DEFAULT,
	QAT_ORDER,
	QAT_STORAGE_KEY,
} from "common/constant"
import { translate } from "locales/translate"
import type { Size } from "types/engine.types"
import type { QatItemId } from "types/store.types"

/**
 * the saved Quick Access Toolbar. reading it through the fixed order keeps the
 * fixed order whatever the stored array says, and a blocked store falls back.
 */
export function readQat(): QatItemId[] {
	try {
		const saved: unknown = JSON.parse(
			localStorage.getItem(QAT_STORAGE_KEY) ?? "null",
		)
		if (!Array.isArray(saved)) return QAT_DEFAULT

		return QAT_ORDER.filter(id => saved.includes(id))
	} catch {
		return QAT_DEFAULT
	}
}

export function writeQat(items: QatItemId[]): void {
	try {
		localStorage.setItem(QAT_STORAGE_KEY, JSON.stringify(items))
	} catch {
		// storage blocked: the toolbar simply forgets between sessions
	}
}

/**
 * the page size the last handle drag settled on, which New and the next visit
 * open at. a paste that widens the paper is not a choice and never lands here.
 */
export function readPageSize(): Size {
	try {
		return parsePageSize(
			JSON.parse(localStorage.getItem(PAGE_SIZE_STORAGE_KEY) ?? "null"),
		)
	} catch {
		return DEFAULT_DOCUMENT
	}
}

export function writePageSize(size: Size): void {
	try {
		localStorage.setItem(PAGE_SIZE_STORAGE_KEY, JSON.stringify(size))
	} catch {
		// storage blocked: every visit opens at the default size
	}
}

/** a stored size is taken whole: one unusable side and the default wins. */
export function parsePageSize(saved: unknown): Size {
	const size = saved as Partial<Size> | null
	const width = usableSide(size?.width)
	const height = usableSide(size?.height)

	return width && height ? { width, height } : DEFAULT_DOCUMENT
}

/** zero stands for unusable, which is a side the document can never have. */
function usableSide(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value)) return 0

	return value >= 1 && value <= MAX_DIMENSION ? value : 0
}

/** a document that has never been named shows the localised "Untitled". */
export function documentName(fileName: string): string {
	return fileName || translate("document.name.untitled")
}

/**
 * the one window title, shown by the in-app title bar and the browser tab.
 * the leading star is Paint's unsaved marker.
 */
export function windowTitle(fileName: string, isDirty: boolean): string {
	const title = translate("titlebar.window.title", {
		0: documentName(fileName),
	})
	return isDirty ? `*${title}` : title
}
