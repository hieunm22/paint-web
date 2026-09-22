import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { windowTitle } from "store/common"
import { useAppSelector } from "store/hooks"

/**
 * keeps the browser tab in step with the title bar: file name, unsaved star
 * and language. index.html only carries the bare product name.
 */
export function useDocumentTitle(): void {
	const { i18n } = useTranslation()
	const fileName = useAppSelector(s => s.doc.fileName)
	const isDirty = useAppSelector(s => s.doc.isDirty)

	useEffect(() => {
		document.title = windowTitle(fileName, isDirty)
	}, [fileName, isDirty, i18n.language])
}
