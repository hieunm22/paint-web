import type { ReactNode } from "react"
import type { IconName } from "components/Icon/types"

export interface RibbonButtonProps {
	label: string
	icon?: IconName
	iconNode?: ReactNode
	title?: string
	disabled?: boolean
	selected?: boolean
	/** shows the dropdown caret, for a button that opens a menu. */
	caret?: boolean
	onClick?: () => void
}

export interface SplitButtonProps extends RibbonButtonProps {
	/** dropdown content, rendered when `open` is true. */
	menu?: ReactNode
	open?: boolean
	onToggleMenu?: () => void
}
