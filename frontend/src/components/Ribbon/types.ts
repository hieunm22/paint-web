import type { IconName } from "components/Icon/types"
import type {
	BrushKind,
	BrushSize,
	RibbonTabId,
	StrokeStyle,
	ToolId,
} from "store/types"

export interface RibbonTabDef {
	id: RibbonTabId
	labelKey: string
}

export interface ToolDef {
	id: ToolId
	icon: IconName
	labelKey: string
}

export interface BrushDef {
	id: BrushKind
	icon: IconName
	labelKey: string
	/** glyph rotation mimicking the calligraphy stamp angle. */
	rotate?: number
}

export interface StrokeStyleDef {
	id: StrokeStyle
	labelKey: string
}

export type SizeDef = BrushSize

export interface StrokeMenuButtonProps {
	menuId: "outline" | "fill"
	label: string
	value: StrokeStyle
	disabled: boolean
	open: boolean
	onToggle: () => void
	onPick: (style: StrokeStyle) => void
}

export interface ColorSlotProps {
	label: string
	hex: string
	editing: boolean
	onClick: () => void
}
