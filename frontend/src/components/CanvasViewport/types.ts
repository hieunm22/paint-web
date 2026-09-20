import type { RefObject } from "react"
import type { Modifiers, Size } from "types/engine.types"
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

export interface RulerProps {
	orientation: "h" | "v"
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

/**
 * pointer positions waiting for the next frame. a pen reports up to 1000 times
 * a second, and drawing each batch as it lands repeats work within a frame.
 */
export interface PointerBatch {
	points: Point[]
	mods: Modifiers
	frame: number | null
}

export interface ThumbnailProps {
	zoom: number
	/** the scrolling viewport the frame moves. */
	scrollRef: RefObject<HTMLDivElement>
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
