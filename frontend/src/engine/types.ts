import type { AppDispatch } from "store"
import type { Point, Rect, ToolId } from "store/types"
import type { Surface } from "./Surface"

export interface Size {
	width: number
	height: number
}

/** the three stacked canvases one Surface drives. */
export interface SurfaceLayers {
	base: HTMLCanvasElement
	preview: HTMLCanvasElement
	overlay: HTMLCanvasElement
}

export interface SurfaceContexts {
	base: CanvasRenderingContext2D
	preview: CanvasRenderingContext2D
	overlay: CanvasRenderingContext2D
}

/** one pixel, channels 0-255. */
export interface RGBA {
	r: number
	g: number
	b: number
	a: number
}

/** pointer state a tool reads: which button started the gesture, plus keys. */
export interface Modifiers {
	/** right button, or Ctrl+click on macOS: the gesture uses colour 2. */
	secondary: boolean
	shift: boolean
	alt: boolean
}

/** everything a tool may touch. the tool itself holds no reference to react. */
export interface ToolContext {
	base: CanvasRenderingContext2D
	preview: CanvasRenderingContext2D
	surface: Surface
	color1: string
	color2: string
	size: number
	/** current view zoom, which only the magnifier steps through. */
	zoom: number
	doc: Size
	dispatch: AppDispatch
	/** call before writing pixels there: it snapshots them for undo. */
	markDirty(rect: Rect): void
}

export interface Tool {
	readonly id: ToolId
	/** history label for the step this tool pushes. */
	readonly label: string
	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void
	update?(pts: Point[], mods: Modifiers, ctx: ToolContext): void
	end?(pt: Point, mods: Modifiers, ctx: ToolContext): void
	/** the user switched tool mid-gesture. */
	cancel?(ctx: ToolContext): void
}

/** one undo step: the tiles as they were before the stroke rewrote them. */
export interface HistoryEntry {
	label: string
	tiles: Map<number, ImageData>
}
