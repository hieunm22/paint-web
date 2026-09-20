import type { ReactNode } from "react"
import type { EmptyVoid, RecentEntry } from "types/common.types"
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

/** one choice under Print: it prints, or it opens a dialog. */
export interface PrintMenuRow {
	labelKey: string
	icon: IconName
	shortcutKey?: string
	dialog?: DialogId
}

export interface FileMenuRowProps {
	row: FileMenuEntry
	title?: string
	/** set on a row that opens choices beneath it, which turns the caret over. */
	expanded?: boolean
	onClick: EmptyVoid
}

/** a backstage row whose choices open under it, such as Save as or Print. */
export interface CollapseRowProps {
	row: FileMenuEntry
	children: ReactNode
	open: boolean
	onToggle: EmptyVoid
}

/** one choice inside an opened row, drawn a step further in than the row. */
export interface SubRowProps {
	icon: IconName
	label: string
	shortcut?: string
	onClick: EmptyVoid
}

/** the backstage recents list, and the way a row leaves it. */
export interface RecentsState {
	entries: RecentEntry[]
	forget(name: string): Promise<void>
}

export interface RecentPictureProps {
	entry: RecentEntry
	onOpen: EmptyVoid
	onForget: EmptyVoid
}

export interface SaveAsChoicesProps {
	onPick(format: ImageFormat): void
	onOther: EmptyVoid
}

export interface PrintChoicesProps {
	onPrint: EmptyVoid
}
