import type { Modifiers } from "engine/types"
import type { Point } from "store/types"

export type HandlePosition = "nw" | "n" | "ne" | "w" | "e" | "sw" | "s" | "se"

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
 * a second, and drawing each batch as it lands would paint several times in
 * one frame for nothing.
 */
export interface PointerBatch {
	points: Point[]
	mods: Modifiers
	frame: number | null
}
