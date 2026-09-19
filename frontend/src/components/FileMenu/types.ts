import type { IconName } from "components/Icon/types"
import type { DialogId, ImageFormat } from "store/types"

/** what a backstage row does when it is not simply opening a dialog. */
export type FileMenuAction =
	"new" | "open" | "save" | "save-as" | "copy-image" | "exit"

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

export interface FileMenuRowProps {
	row: FileMenuEntry
	title?: string
	onClick(): void
}

export interface SaveAsMenuProps {
	onPick(format: ImageFormat): void
	onOther(): void
}
