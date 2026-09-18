import type { IconName } from "components/Icon/types"
import type { DialogId } from "store/types"

export interface FileMenuEntry {
	label: string
	icon: IconName
	shortcut?: string
	submenu?: boolean
	dialog?: DialogId
	/** tooltip note, used for entries that were remapped for the web. */
	note?: string
}

export type FileMenuRow = FileMenuEntry | "sep"

export interface RecentPicture {
	name: string
	location: string
	agoDays: number
}
