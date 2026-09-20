import { QAT_DEFAULT, QAT_STORAGE_KEY } from "common/constant"
import { translate } from "locales/translate"
import type { QatItemId } from "types/store.types"

/**
 * the saved Quick Access Toolbar. reading it through the default keeps the
 * fixed order whatever the stored array says, and a blocked store falls back.
 */
export function readQat(): QatItemId[] {
	try {
		const saved: unknown = JSON.parse(
			localStorage.getItem(QAT_STORAGE_KEY) ?? "null",
		)
		if (!Array.isArray(saved)) return QAT_DEFAULT

		return QAT_DEFAULT.filter(id => saved.includes(id))
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
