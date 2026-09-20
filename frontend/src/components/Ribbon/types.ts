import type { KeyboardEvent, RefObject } from "react"
import type { EmptyVoid } from "types/common.types"
import type {
	BrushKind,
	BrushSize,
	RibbonTabId,
	ShapeKind,
	StrokeStyle,
	TextOptions,
	ToolId,
} from "types/store.types"
import type { IconName } from "components/Icon/types"

export interface RibbonTabDef {
	id: RibbonTabId
	labelKey: string
}

/** what the toolbar container needs to keep one button in the tab order. */
export interface RovingFocus {
	ref: RefObject<HTMLDivElement>
	onKeyDown(e: KeyboardEvent<HTMLDivElement>): void
	onFocus: EmptyVoid
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

/** what the font box lists, and the ask that turns it into the real one. */
export interface FontFamilyList {
	families: string[]
	/** opening the box is the gesture the permission prompt needs behind it. */
	load(): void
}

/** the four character styles of the Text tab, each an independent toggle. */
export type FontStyleId = "bold" | "italic" | "underline" | "strikethrough"

export interface FontStyleDef {
	id: FontStyleId
	icon: IconName
	labelKey: string
}

/** what the Font and Background groups read and write, in one place. */
export interface TextRibbonState {
	options: TextOptions
	setFamily(family: string): void
	setSize(size: number): void
	toggleStyle(id: FontStyleId): void
	setBackground(background: TextOptions["background"]): void
}

export type SizeDef = BrushSize

export interface ShapeCellProps {
	kind: ShapeKind
	selected: boolean
	disabled: boolean
	onPick: (kind: ShapeKind) => void
}

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
