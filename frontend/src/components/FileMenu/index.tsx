import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { FileMenuList, LanguagePicker, RecentPictureList } from "./components"
import { useAppDispatch } from "store/hooks"
import { closeBackstage } from "store/slices/uiSlice"
import "./FileMenu.scss"

/** blue backstage panel for the File tab, covering ribbon and canvas. */
export function FileMenu() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()

	return (
		<div className="file-menu" role="menu" aria-label={t("ribbon.tab.file")}>
			<div className="file-menu__left">
				<button
					type="button"
					className="file-menu__back"
					onClick={() => dispatch(closeBackstage())}
				>
					<Icon name="back" size={12} />
					{t("filemenu.nav.back")}
				</button>
				<FileMenuList />
				<LanguagePicker />
			</div>

			<div className="file-menu__right">
				<div className="file-menu__right-title">
					{t("filemenu.recent.title")}
				</div>
				<RecentPictureList />
			</div>
		</div>
	)
}
