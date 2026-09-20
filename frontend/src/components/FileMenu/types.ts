import type { ReactNode } from "react"
import type { EmptyVoid } from "types/common.types"
import type { DialogId, ImageFormat } from "types/store.types"
import type { IconName } from "components/Icon/types"

/** what a backstage row does when it is not simply opening a dialog. */
export type FileMenuAction =
	"new" | "open" | "save" | "save-as" | "print" | "copy-image" | "exit"

export interface FileMenuEntry {
	labelKey: string
	icon: IconName
	shortcutKey?: string
	submenu?: boolean
	dialog?: DialogId
	action?: FileMenuAction
	/** tooltip note, used for entries that were remapped for the web. */
	noteKey?: string
	/** the row is in the design but does nothing yet. */
	pending?: boolean
}

export type FileMenuRow = FileMenuEntry | "sep"

/** one row of the Print flyout: it prints, or it opens a dialog. */
export interface PrintMenuRow {
	labelKey: string
	icon: IconName
	shortcutKey?: string
	dialog?: DialogId
}

export interface FileMenuRowProps {
	row: FileMenuEntry
	title?: string
	onClick: EmptyVoid
}

/** a backstage row whose flyout opens beside it, such as Save as or Print. */
export interface FlyoutRowProps {
	row: FileMenuEntry
	menu: ReactNode
	open: boolean
	onOpen: EmptyVoid
}

export interface SaveAsMenuProps {
	onPick(format: ImageFormat): void
	onOther: EmptyVoid
}

export interface PrintMenuProps {
	onPrint: EmptyVoid
}
