import type { QatItemId } from "types/store.types"
import { EmptyVoid } from "types/common.types"
import type { IconName } from "components/Icon/types"

export interface QatItemDef {
	id: QatItemId
	icon: IconName
	labelKey: string
	/** absent for a command Paint gives no key of its own. */
	shortcutKey?: string
}

export interface QatItem extends QatItemDef {
	title: string
	disabled: boolean
	onClick?: EmptyVoid
}

export type WindowButtonId = "minimize" | "maximize" | "close"

export interface WindowButton {
	id: WindowButtonId
	icon: IconName
	titleKey: string
	size: number
	disabled?: boolean
}
