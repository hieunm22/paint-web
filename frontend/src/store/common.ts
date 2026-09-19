import { translate } from "locales/translate"

/** a document that has never been named shows the localised "Untitled". */
export function documentName(fileName: string): string {
	return fileName || translate("document.name.untitled")
}
