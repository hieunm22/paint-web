import { useTranslation } from "react-i18next"
import { CAN_SAVE_IN_PLACE, EXTENSIONS, LANGUAGES } from "common/constant"
import {
	FILE_MENU_ROWS,
	PRINT_MENU,
	PRINT_MENU_ROWS,
	QUICK_SAVE_FORMATS,
	SAVE_AS_MENU,
} from "./constant"
import { Icon } from "components/Icon"
import {
	Menu,
	MenuAnchor,
	MenuItem,
	MenuSeparator,
} from "components/Menu"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useRecents } from "./hooks"
import { currentLanguage, setLanguage } from "locales/i18n"
import { closeBackstage, openDialog, toggleMenu } from "store/slices/uiSlice"
import type { ImageFormat } from "types/store.types"
import type {
	FileMenuEntry,
	FileMenuRowProps,
	FlyoutRowProps,
	PrintMenuProps,
	SaveAsMenuProps,
} from "./types"

function FileMenuRow({ row, title, onClick }: FileMenuRowProps) {
	const { t } = useTranslation()

	return (
		<button
			type="button"
			className="file-menu__item"
			title={title}
			disabled={row.pending}
			onClick={onClick}
		>
			<span className="file-menu__item-icon">
				<Icon name={row.icon} size={17} />
			</span>
			<span className="file-menu__item-label">{t(row.labelKey)}</span>
			{row.shortcutKey && (
				<span className="file-menu__item-shortcut">{t(row.shortcutKey)}</span>
			)}
			{row.submenu && <Icon name="caretDown" size={9} />}
		</button>
	)
}

/** a row whose flyout opens beside it rather than doing something at once. */
function FlyoutRow({
	row,
	menu,
	open,
	onOpen,
}: FlyoutRowProps) {
	return (
		<MenuAnchor className="file-menu__anchor">
			<FileMenuRow row={row} onClick={onOpen} />
			{open && menu}
		</MenuAnchor>
	)
}

function PrintMenu({ onPrint }: PrintMenuProps) {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()

	return (
		<Menu width={196}>
			{PRINT_MENU_ROWS.map(row => (
				<MenuItem
					key={row.labelKey}
					icon={row.icon}
					label={t(row.labelKey)}
					shortcut={row.shortcutKey && t(row.shortcutKey)}
					onClick={() =>
						row.dialog ? dispatch(openDialog(row.dialog)) : onPrint()
					}
				/>
			))}
		</Menu>
	)
}

function SaveAsMenu({ onPick, onOther }: SaveAsMenuProps) {
	const { t } = useTranslation()

	return (
		<Menu width={196}>
			{QUICK_SAVE_FORMATS.map(format => (
				<MenuItem
					key={format}
					icon="saveAs"
					label={t("filemenu.save-as.option", {
						0: format.toUpperCase(),
						1: EXTENSIONS[format],
					})}
					onClick={() => onPick(format)}
				/>
			))}
			<MenuSeparator />
			<MenuItem
				icon="properties"
				label={t("filemenu.save-as.other")}
				onClick={onOther}
			/>
		</Menu>
	)
}

export function FileMenuList() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const openMenu = useAppSelector(s => s.ui.openMenu)

	const run = (row: FileMenuEntry) => {
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
				) : row.action === "save-as" ? (
					<FlyoutRow
						key={row.labelKey}
						row={row}
						open={openMenu === SAVE_AS_MENU}
						onOpen={() => run(row)}
						menu={
							<SaveAsMenu
								onPick={(format: ImageFormat) => void files.saveAs(format)}
								onOther={() => dispatch(openDialog("save-as"))}
							/>
						}
					/>
				) : row.action === "print" ? (
					<FlyoutRow
						key={row.labelKey}
						row={row}
						open={openMenu === PRINT_MENU}
						onOpen={() => run(row)}
						menu={
							<PrintMenu
								onPrint={() => {
									// the sheet is what the user is looking at next, not
									// the backstage the command was reached through
									dispatch(closeBackstage())
									void files.print()
								}}
							/>
						}
					/>
				) : (
					<FileMenuRow
						key={row.labelKey}
						row={row}
						title={noteFor(row)}
						onClick={() => run(row)}
					/>
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
			{LANGUAGES.map(language => (
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
	const { t, i18n } = useTranslation()
	const files = useFileCommands()
	const entries = useRecents()

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
				<button
					key={entry.name}
					type="button"
					className="file-menu__recent-item"
					onClick={() => void files.openRecent(entry)}
				>
					<img className="file-menu__thumb" src={entry.thumbnail} alt="" />
					<span>
						<div className="file-menu__recent-name">{entry.name}</div>
						<div className="file-menu__recent-meta">
							{t("filemenu.recent.meta", {
								0: entry.format.toUpperCase(),
								1: new Date(entry.openedAt).toLocaleDateString(i18n.language),
							})}
						</div>
					</span>
				</button>
			))}
		</div>
	)
}
