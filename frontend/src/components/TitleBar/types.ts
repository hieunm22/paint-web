import type { IconName } from "components/Icon/types"

export type QatItemId = "save" | "undo" | "redo"

export interface QatItemDef {
	id: QatItemId
	icon: IconName
	labelKey: string
	shortcutKey: string
}

export interface QatItem extends QatItemDef {
	title: string
	disabled: boolean
	onClick?: () => void
}

export interface WindowButton {
	id: "minimize" | "maximize" | "close"
	icon: IconName
	titleKey: string
	size: number
	disabled?: boolean
}
