import type { ReactNode } from "react"
import type { RGBA, WinHsl } from "types/engine.types"
import type { ImageFormat } from "types/store.types"

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

/** what the Save As dialog collects before it hands over to the picker. */
export interface SaveAsForm {
	name: string
	format: ImageFormat
	quality: number
	setName(name: string): void
	setFormat(format: ImageFormat): void
	setQuality(quality: number): void
}

export interface NumFieldProps {
	label: string
	value: number
	max: number
	onChange(value: number): void
}

/**
 * one colour told both ways. the channels stay exact while the coarser hsl
 * drives the field and the bar, which is the split the Windows dialog makes.
 */
export interface EditColorsValue {
	hsl: WinHsl
	rgb: RGBA
}

export interface EditColorsForm extends EditColorsValue {
	hex: string
	setHsl(next: Partial<WinHsl>): void
	setRgb(next: Partial<RGBA>): void
	/** a click in the hue field, as fractions across it and down it. */
	pickTone(across: number, down: number): void
	/** a click down the luminance bar. */
	pickLevel(down: number): void
	pick(hex: string): void
}

/** a click or drag anywhere in a colour field, as fractions of its box. */
export type FieldPick = (across: number, down: number) => void

/** Resize takes either a percentage of the current size or a pixel count. */
export type ResizeUnit = "percent" | "pixels"

/** what Resize and Skew collects; only OK hands it to the engine. */
export interface ResizeSkewForm {
	unit: ResizeUnit
	horizontal: number
	vertical: number
	ratio: boolean
	skewH: number
	skewV: number
	setUnit(unit: ResizeUnit): void
	setHorizontal(value: number): void
	setVertical(value: number): void
	setRatio(on: boolean): void
	setSkewH(value: number): void
	setSkewV(value: number): void
	apply(): void
}
