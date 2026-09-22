import classnames from "classnames"
import { useTranslation } from "react-i18next"
import { CAN_SAVE_IN_PLACE, EXTENSIONS, LANGUAGES } from "common/constant"
import {
	FILE_MENU_ROWS,
	MENU_IDS,
	PANEL_TITLE_KEYS,
	PRINT_MENU,
	PRINT_MENU_ROWS,
	QUICK_SAVE_FORMATS,
	RECENT_TITLE_KEY,
	SAVE_AS_MENU,
} from "./constant"
import { Icon } from "components/Icon"
import { shortcutText } from "locales/common"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useRecents } from "./hooks"
import { currentLanguage, setLanguage } from "locales/i18n"
import {
	closeBackstage,
	closeMenu,
	openDialog,
	toggleMenu,
} from "store/slices/uiSlice"
import type { ImageFormat } from "types/store.types"
import type {
	ChoiceRowProps,
	FileMenuEntry,
	FileMenuRowProps,
	PrintChoicesProps,
	RecentPictureProps,
	SaveAsChoicesProps,
} from "./types"

function FileMenuRow({
	row,
	title,
	expanded,
	onClick,
}: FileMenuRowProps) {
	const { t } = useTranslation()
	const cls = classnames("file-menu__item", {
		"file-menu__item--open": expanded,
	})

	return (
		<button
			type="button"
			className={cls}
			title={title}
			disabled={row.pending}
			aria-expanded={row.submenu ? Boolean(expanded) : undefined}
			onClick={onClick}
		>
			<span className="file-menu__item-icon">
				<Icon name={row.icon} size={17} />
			</span>
			<span className="file-menu__item-label">{t(row.labelKey)}</span>
			{row.shortcutKey && (
				<span className="file-menu__item-shortcut">
					{shortcutText(row.shortcutKey)}
				</span>
			)}
			{row.submenu && (
				<span className="file-menu__caret">
					<Icon name="caretRight" size={9} />
				</span>
			)}
		</button>
	)
}

/** one choice of an opened row, standing in the panel beside the column. */
function ChoiceRow({
	icon,
	label,
	shortcut,
	onClick,
}: ChoiceRowProps) {
	return (
		<button type="button" className="file-menu__choice" onClick={onClick}>
			<span className="file-menu__choice-icon">
				<Icon name={icon} size={18} />
			</span>
			<span className="file-menu__choice-label">{label}</span>
			{shortcut && (
				<span className="file-menu__choice-shortcut">{shortcut}</span>
			)}
		</button>
	)
}

function PrintChoices({ onPrint }: PrintChoicesProps) {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()

	return (
		<>
			{PRINT_MENU_ROWS.map(row => (
				<ChoiceRow
					key={row.labelKey}
					icon={row.icon}
					label={t(row.labelKey)}
					shortcut={row.shortcutKey && shortcutText(row.shortcutKey)}
					onClick={() =>
						row.dialog ? dispatch(openDialog(row.dialog)) : onPrint()
					}
				/>
			))}
		</>
	)
}

function SaveAsChoices({ onPick, onOther }: SaveAsChoicesProps) {
	const { t } = useTranslation()

	return (
		<>
			{QUICK_SAVE_FORMATS.map(format => (
				<ChoiceRow
					key={format}
					icon="saveAs"
					label={t("filemenu.save-as.option", {
						0: format.toUpperCase(),
						1: EXTENSIONS[format],
					})}
					onClick={() => onPick(format)}
				/>
			))}
			<div className="file-menu__choice-sep" />
			<ChoiceRow
				icon="properties"
				label={t("filemenu.save-as.other")}
				onClick={onOther}
			/>
		</>
	)
}

export function FileMenuList() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const openMenu = useAppSelector(s => s.ui.openMenu)

	const run = (row: FileMenuEntry) => {
		// anything but a flyout takes the panel back to the recents list
		if (!row.submenu) dispatch(closeMenu())
		if (row.dialog) {
			dispatch(openDialog(row.dialog))
			return
		}
		switch (row.action) {
			case "new":
				return files.newDocument()
			case "open":
				return void files.openDocument()
			case "save":
				return void files.save()
			case "save-as":
				return void dispatch(toggleMenu(SAVE_AS_MENU))
			case "print":
				return void dispatch(toggleMenu(PRINT_MENU))
			case "copy-image":
				return void files.copyImage()
			case "exit":
				return files.exit()
		}
	}

	// without the File System Access API Save cannot overwrite anything
	const noteFor = (row: FileMenuEntry) => {
		if (row.noteKey) return t(row.noteKey)
		if (row.action === "save" && !CAN_SAVE_IN_PLACE) {
			return t("filemenu.item.save-note")
		}
		return undefined
	}

	return (
		<>
			{FILE_MENU_ROWS.map((row, i) =>
				row === "sep" ? (
					<div key={`sep-${i}`} className="file-menu__sep" />
				) : (
					<FileMenuRow
						key={row.labelKey}
						row={row}
						title={noteFor(row)}
						expanded={openMenu === MENU_IDS[row.action ?? ""]}
						onClick={() => run(row)}
					/>
				),
			)}
		</>
	)
}

/**
 * the panel beside the column
 */
export function FileMenuPanel() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const openMenu = useAppSelector(s => s.ui.openMenu) ?? ""
	const titleKey = PANEL_TITLE_KEYS[openMenu] ?? RECENT_TITLE_KEY

	const print = () => {
		dispatch(closeBackstage())
		void files.print()
	}

	const saveAs = (format: ImageFormat) => {
		dispatch(closeMenu())
		void files.saveAs(format)
	}

	return (
		<div className="file-menu__right">
			<div className="file-menu__right-title">{t(titleKey)}</div>
			{openMenu === SAVE_AS_MENU ? (
				<div className="file-menu__choice-list">
					<SaveAsChoices
						onPick={saveAs}
						onOther={() => dispatch(openDialog("save-as"))}
					/>
				</div>
			) : openMenu === PRINT_MENU ? (
				<div className="file-menu__choice-list">
					<PrintChoices onPrint={print} />
				</div>
			) : (
				<RecentPictureList />
			)}
		</div>
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
			{LANGUAGES.map(lang => {
				const cls = classnames("file-menu__language-btn", {
					"file-menu__language-btn--active": lang.id === active,
				})

				return (
					<button
						key={lang.id}
						type="button"
						className={cls}
						aria-pressed={lang.id === active}
						onClick={() => setLanguage(lang.id)}
					>
						{t(lang.labelKey)}
					</button>
				)
			})}
		</div>
	)
}

/** the row opens the picture; the cross beside it only drops the row. */
function RecentPicture({ entry, onOpen, onForget }: RecentPictureProps) {
	const { t, i18n } = useTranslation()
	const format = entry.format.toUpperCase()
	const opened = new Date(entry.openedAt)
	const day = opened.toLocaleDateString(i18n.language)
	const meta = t("filemenu.recent.meta", { 0: format, 1: day })
	const forgetLabel = t("filemenu.recent.forget")

	return (
		<div className="file-menu__recent-item">
			<button type="button" className="file-menu__recent-open" onClick={onOpen}>
				<img className="file-menu__thumb" src={entry.thumbnail} alt="" />
				<span className="file-menu__recent-text">
					<div className="file-menu__recent-name" title={entry.name}>
						{entry.name}
					</div>
					<div className="file-menu__recent-meta">{meta}</div>
				</span>
			</button>
			<button
				type="button"
				className="file-menu__recent-forget"
				title={forgetLabel}
				aria-label={forgetLabel}
				onClick={onForget}
			>
				<Icon name="close" size={11} />
			</button>
		</div>
	)
}

export function RecentPictureList() {
	const { t } = useTranslation()
	const files = useFileCommands()
	const { entries, forget } = useRecents()

	if (!entries.length) {
		return (
			<div className="file-menu__recent-empty">
				{t("filemenu.recent.empty")}
			</div>
		)
	}

	return (
		<div className="file-menu__recent-list">
			{entries.map(entry => (
				<RecentPicture
					key={entry.name}
					entry={entry}
					onOpen={() => void files.openRecent(entry)}
					onForget={() => void forget(entry.name)}
				/>
			))}
		</div>
	)
}
