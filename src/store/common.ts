import { translate } from "locales/translate"

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
