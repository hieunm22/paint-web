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
	CollapseRowProps,
	FileMenuEntry,
	FileMenuRowProps,
	PrintChoicesProps,
	RecentPictureProps,
	SaveAsChoicesProps,
	SubRowProps,
} from "./types"

function FileMenuRow({
	row,
	title,
	expanded,
	onClick,
}: FileMenuRowProps) {
	const { t } = useTranslation()

	return (
		<button
			type="button"
			className="file-menu__item"
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
				<span className="file-menu__item-shortcut">{t(row.shortcutKey)}</span>
			)}
			{row.submenu && (
				<span
					className={`file-menu__caret${
						expanded ? " file-menu__caret--open" : ""
					}`}
				>
					<Icon name="caretDown" size={9} />
				</span>
			)}
		</button>
	)
}

/** a row whose choices open underneath it rather than beside it. */
function CollapseRow({
	row,
	children,
	open,
	onToggle,
}: CollapseRowProps) {
	return (
		// the marker keeps a click inside from reaching the outside-click handler,
		// which would fold the group up before the choice was taken
		<div className="file-menu__group" data-menu-root>
			<FileMenuRow row={row} expanded={open} onClick={onToggle} />
			{open && <div className="file-menu__choices">{children}</div>}
		</div>
	)
}

/** one choice of an opened row: the same row, one indent further in. */
function SubRow({
	icon,
	label,
	shortcut,
	onClick,
}: SubRowProps) {
	return (
		<button
			type="button"
			className="file-menu__item file-menu__item--sub"
			onClick={onClick}
		>
			<span className="file-menu__item-icon">
				<Icon name={icon} size={15} />
			</span>
			<span className="file-menu__item-label">{label}</span>
			{shortcut && <span className="file-menu__item-shortcut">{shortcut}</span>}
		</button>
	)
}

function PrintChoices({ onPrint }: PrintChoicesProps) {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()

	return (
		<>
			{PRINT_MENU_ROWS.map(row => (
				<SubRow
					key={row.labelKey}
					icon={row.icon}
					label={t(row.labelKey)}
					shortcut={row.shortcutKey && t(row.shortcutKey)}
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
				<SubRow
					key={format}
					icon="saveAs"
					label={t("filemenu.save-as.option", {
						0: format.toUpperCase(),
						1: EXTENSIONS[format],
					})}
					onClick={() => onPick(format)}
				/>
			))}
			<div className="file-menu__sep file-menu__sep--sub" />
			<SubRow
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
					<CollapseRow
						key={row.labelKey}
						row={row}
						open={openMenu === SAVE_AS_MENU}
						onToggle={() => run(row)}
					>
						<SaveAsChoices
							onPick={(format: ImageFormat) => {
								dispatch(closeMenu())
								void files.saveAs(format)
							}}
							onOther={() => dispatch(openDialog("save-as"))}
						/>
					</CollapseRow>
				) : row.action === "print" ? (
					<CollapseRow
						key={row.labelKey}
						row={row}
						open={openMenu === PRINT_MENU}
						onToggle={() => run(row)}
					>
						<PrintChoices
							onPrint={() => {
								// the sheet is what the user is looking at next, not the
								// backstage the command was reached through
								dispatch(closeBackstage())
								void files.print()
							}}
						/>
					</CollapseRow>
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
				<span>
					<div className="file-menu__recent-name">{entry.name}</div>
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
