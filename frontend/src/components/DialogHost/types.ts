import type { ReactNode, RefObject } from "react"
import type { EmptyVoid, PrintLayout } from "types/common.types"
import type { RGBA, Size, WinHsl } from "types/engine.types"
import type {
	ImageFormat,
	PageOrientation,
	PaperSize,
	PrintMargins,
} from "types/store.types"

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

/** one paper Page setup offers. */
export interface PaperOption {
	id: PaperSize
	labelKey: string
}

export interface OrientationOption {
	id: PageOrientation
	labelKey: string
}

/** one of the four margin fields. */
export interface MarginField {
	edge: keyof PrintMargins
	labelKey: string
}

/** the sheet the preview draws, with the picture already encoded for it. */
export interface PrintPreview {
	/** object url of the whole picture, empty until it has been encoded. */
	src: string
	layout: PrintLayout
	doc: Size
}

/** the live camera behind the From camera dialog. */
export interface CameraSession {
	videoRef: RefObject<HTMLVideoElement>
	/** translation key of what went wrong, or null while all is well. */
	errorKey: string | null
	/** true once a frame is running, which is what arms the Capture button. */
	ready: boolean
	capture: EmptyVoid
}

/** what the dialog does with the frame it just took. */
export type CameraCapture = (blob: Blob) => void

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
