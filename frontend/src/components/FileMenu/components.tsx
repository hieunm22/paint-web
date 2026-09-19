import { useTranslation } from "react-i18next"
import { FILE_MENU_ROWS, RECENT_PICTURES } from "./constant"
import { Icon } from "components/Icon"
import { LANGUAGES } from "locales/constant"
import { currentLanguage, setLanguage } from "locales/i18n"
import { useAppDispatch } from "store/hooks"
import { openDialog } from "store/slices/uiSlice"

export function FileMenuList() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()

	return (
		<>
			{FILE_MENU_ROWS.map((row, i) =>
				row === "sep" ? (
					<div key={`sep-${i}`} className="file-menu__sep" />
				) : (
					<button
						key={row.labelKey}
						type="button"
						className="file-menu__item"
						title={row.noteKey && t(row.noteKey)}
						onClick={() =>
							row.dialog ? dispatch(openDialog(row.dialog)) : undefined
						}
					>
						<span className="file-menu__item-icon">
							<Icon name={row.icon} size={17} />
						</span>
						<span className="file-menu__item-label">{t(row.labelKey)}</span>
						{row.shortcutKey && (
							<span className="file-menu__item-shortcut">
								{t(row.shortcutKey)}
							</span>
						)}
						{row.submenu && <Icon name="caretDown" size={9} />}
					</button>
				),
			)}
		</>
	)
}

/** Paint has no such control; the web build needs somewhere to pick a language. */
export function LanguagePicker() {
	const { t } = useTranslation()
	const active = currentLanguage()

	return (
		<div className="file-menu__language">
			<span className="file-menu__language-label">
				{t("filemenu.language.label")}
			</span>
			{LANGUAGES.map((language) => (
				<button
					key={language.id}
					type="button"
					className={`file-menu__language-btn${
						language.id === active ? " file-menu__language-btn--active" : ""
					}`}
					aria-pressed={language.id === active}
					onClick={() => setLanguage(language.id)}
				>
					{t(language.labelKey)}
				</button>
			))}
		</div>
	)
}

export function RecentPictureList() {
	const { t } = useTranslation()

	return (
		<div className="file-menu__recent-list">
			{RECENT_PICTURES.map((pic) => (
				<button key={pic.name} type="button" className="file-menu__recent-item">
					<span className="file-menu__thumb">
						<Icon name="thumbnail" size={18} />
					</span>
					<span>
						<div className="file-menu__recent-name">{pic.name}</div>
						<div className="file-menu__recent-meta">
							{t("filemenu.recent.meta", {
								0: pic.location,
								1: pic.agoDays,
							})}
						</div>
					</span>
				</button>
			))}
		</div>
	)
}
