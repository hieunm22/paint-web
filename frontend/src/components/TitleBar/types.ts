import type { IconName } from "components/Icon/types"

export interface QatItem {
	id: string
	icon: IconName
	title: string
	disabled?: boolean
}

export interface WindowButton {
	id: "minimize" | "maximize" | "close"
	icon: IconName
	title: string
	size: number
	disabled?: boolean
}
