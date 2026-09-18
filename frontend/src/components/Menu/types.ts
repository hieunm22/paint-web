import type { ReactNode, RefObject } from "react"
import type { IconName } from "components/Icon/types"

export interface MenuPosition {
	top: number
	left: number
}

export interface Viewport {
	width: number
	height: number
}

export interface MenuProps {
	children: ReactNode
	width?: number
}

export interface MenuSectionLabelProps {
	children: ReactNode
}

export interface MenuAnchorProps {
	children: ReactNode
	className?: string
}

export type MenuAnchorRef = RefObject<HTMLDivElement>

export interface MenuItemProps {
	label: string
	icon?: IconName
	shortcut?: string
	disabled?: boolean
	/** undefined for a plain item; true or false renders a checkbox or radio mark. */
	checked?: boolean
	submenu?: boolean
	onClick?: () => void
}
