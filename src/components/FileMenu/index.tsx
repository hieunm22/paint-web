import { useTranslation } from "react-i18next"
import { FileMenuList, FileMenuPanel, LanguagePicker } from "./components"
import "./FileMenu.scss"

/** the panel the File tab drops down, closed by a click anywhere outside it. */
export function FileMenu() {
	const { t } = useTranslation()

	return (
		<div
			className="file-menu"
			role="menu"
			aria-label={t("ribbon.tab.file")}
			data-menu-root
		>
			<div className="file-menu__left">
				<FileMenuList />
				<LanguagePicker />
			</div>

			<FileMenuPanel />
		</div>
	)
}
