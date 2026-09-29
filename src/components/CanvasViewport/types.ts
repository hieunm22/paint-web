import type { RefObject } from "react"
import type { Modifiers, Size, StrokePoint } from "types/engine.types"
import type { Point, Rect } from "types/store.types"

/** the three edges Paint lets a document be dragged by. */
export type HandlePosition = "e" | "s" | "se"

export interface ResizeHandlesProps {
	doc: Size
	zoom: number
}

/** live handle drag, kept in a ref to stop pointer moves re-rendering. */
export interface ResizeSession {
	pointerId: number
	handle: HandlePosition
	/** where the pointer went down, in client pixels. */
	start: Point
	/** the paper the drag has reached, committed when the pointer lifts. */
	size: Size
}

/** which ruler: the one along the top, or the one down the side. */
export type RulerOrientation = "h" | "v"

export interface RulerProps {
	orientation: RulerOrientation
	/** length in image pixels. */
	length: number
	zoom: number
}

export interface RulerTick {
	/** position in screen pixels, canvas margin already added. */
	pos: number
	/** tick length. */
	size: number
	/** numeric label, present on major ticks only. */
	label?: number
}

/** the browser's own pointer event, which react shadows with its synthetic one. */
export type NativePointer = PointerEvent

/**
 * pointer positions waiting for the next frame. a pen reports up to 1000 times
 * a second, and drawing each batch as it lands repeats work within a frame.
 */
export interface PointerBatch {
	points: StrokePoint[]
	mods: Modifiers
	frame: number | null
	/** the pointer that began the gesture; a second one is not part of it. */
	pointerId: number | null
	/** a pen in the gesture wins, and the palm resting beside it is ignored. */
	penActive: boolean
	/** the smoothed force carried from one sample to the next. */
	pressure: number | null
	/** the canvas box, measured once a gesture rather than once a sample. */
	rect: DOMRect | null
}

export interface ThumbnailProps {
	/** the open picture, whose proportions the thumbnail keeps. */
	doc: Size
	zoom: number
	/** the scrolling viewport the frame moves. */
	scrollRef: RefObject<HTMLDivElement>
}

/** the four corners of the thumbnail a drag may take hold of. */
export type ThumbnailCorner = "ne" | "nw" | "se" | "sw"

export interface ThumbnailResize {
	corner: ThumbnailCorner
	/** the width the panel stands at, which the drag carries on from. */
	width: number
	doc: Size
	/** the largest the panel may grow, which the drawing area sets. */
	max: Size
	onResize: (width: number) => void
}

/** live thumbnail grip drag, kept in a ref to stop pointer moves re-rendering. */
export interface ThumbnailResizeSession {
	pointerId: number
	/** where the pointer went down, in client pixels. */
	start: Point
	/** the width the grip began at, and the one it has reached. */
	width: number
	next: number
}

export interface TextBoxProps {
	/** the open box in image pixels, which the zoom turns into screen ones. */
	box: Rect
	zoom: number
}

/** live text box drag, kept in a ref to stop pointer moves re-rendering. */
export interface TextDragSession {
	pointerId: number
	start: Point
	/** the corner the box sat at when the drag began, in image pixels. */
	origin: Point
}
