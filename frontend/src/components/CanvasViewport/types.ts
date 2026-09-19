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
 * cursor for drawing tools.
 */
export interface CursorArt {
	url: string
	x: number
	y: number
}
