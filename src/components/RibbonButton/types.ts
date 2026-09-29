import type { ReactNode } from "react"
import { EmptyVoid } from "types/common.types"
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
	/** the letters Alt shows over the button; a split button carries them on its menu half. */
	keyTip?: string
	onClick?: EmptyVoid
}

export interface SplitButtonProps extends RibbonButtonProps {
	/** dropdown content, rendered when `open` is true. */
	menu?: ReactNode
	open?: boolean
	onToggleMenu?: EmptyVoid
}
