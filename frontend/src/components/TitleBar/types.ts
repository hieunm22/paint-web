import type { IconName } from "components/Icon/types"

export type QatItemId = "save" | "undo" | "redo"

export interface QatItem {
	id: QatItemId
	icon: IconName
	title: string
	disabled?: boolean
	onClick?: () => void
}

export interface WindowButton {
	id: "minimize" | "maximize" | "close"
	icon: IconName
	title: string
	size: number
	disabled?: boolean
}
