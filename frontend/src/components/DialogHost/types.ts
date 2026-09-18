import type { ReactNode } from "react"
import type { ImageFormat } from "store/types"

export interface Point {
	x: number
	y: number
}

export interface Viewport {
	width: number
	height: number
}

/** the dialog's untransformed box, captured when a drag starts. */
export interface DragBase {
	left: number
	top: number
	width: number
	height: number
}

/** live drag state, kept in a ref to stop pointer moves from re-rendering. */
export interface DragSession {
	pointerId: number
	start: Point
	origin: Point
	base: DragBase
}

export interface DialogProps {
	title: string
	width?: number
	children: ReactNode
	footer?: ReactNode
}

export interface FormatDef {
	id: ImageFormat
	label: string
	ext: string
}

export interface NumFieldProps {
	label: string
	value: number
}
