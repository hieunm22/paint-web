import type { IconDefinition } from "@fortawesome/pro-solid-svg-icons"
import type { SelectionManager } from "engine/SelectionManager"
import type { Surface } from "engine/Surface"
import type { AppDispatch } from "store"
import type {
	Point,
	Rect,
	ShapeKind,
	StrokeStyle,
	TextOptions,
	ToolId,
} from "types/store.types"

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
	/** held while dragging a selection, it duplicates instead of moving. */
	ctrl: boolean
}

/** everything a tool may touch. the tool itself holds no reference to react. */
export interface ToolContext {
	base: CanvasRenderingContext2D
	preview: CanvasRenderingContext2D
	/** screen space, in css pixels: chrome that is not part of the bitmap. */
	overlay: CanvasRenderingContext2D
	overlaySize: Size
	surface: Surface
	color1: string
	color2: string
	size: number
	/** current view zoom, which only the magnifier steps through. */
	zoom: number
	shape: ShapeKind
	outline: StrokeStyle
	fill: StrokeStyle
	/** colour 2 drops out of a lifted selection when this is on. */
	transparent: boolean
	/** font and background of the text box, which only the text tool reads. */
	text: TextOptions
	doc: Size
	/** the one floating selection, shared by both select tools. */
	selection: SelectionManager
	dispatch: AppDispatch
	/** call before writing pixels there: it snapshots them for undo. */
	markDirty(rect: Rect): void
	defer(label: string, work: Promise<void>): void
}

/**
 * a drawn cursor: the very glyph the ribbon shows for that tool, plus the spot
 * in it that sits on the pointer. an icon definition carries no hotspot.
 */
export interface CursorArt {
	/** icon definition from the icon package, artwork included. */
	icon: IconDefinition
	/** longest side of the drawn glyph, in css pixels. */
	size: number
	/** hotspot as a fraction of the drawn box: the pencil writes at 0.04, 0.95. */
	hotX: number
	hotY: number
}

/** what crosses to the fill worker; the pixel buffer travels, it is not copied. */
export interface FillRequest {
	buffer: ArrayBuffer
	width: number
	height: number
	seed: Point
	color: RGBA
}

export interface FillResponse {
	buffer: ArrayBuffer
	/** the box that changed, or null when the seed already held that colour. */
	dirty: Rect | null
}

/** what crosses to the gif worker; the pixel buffer travels, it is not copied. */
export interface GifRequest {
	buffer: ArrayBuffer
	width: number
	height: number
}

export interface GifResponse {
	/** the finished gif file, ready to wrap in a Blob. */
	buffer: ArrayBuffer
}

export interface Tool {
	readonly id: ToolId
	/** history label for the step this tool pushes, already translated. */
	readonly label: string
	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void
	update?(pts: Point[], mods: Modifiers, ctx: ToolContext): void
	end?(pt: Point, mods: Modifiers, ctx: ToolContext): void
	/** the user switched tool mid-gesture. */
	cancel?(ctx: ToolContext): void
	/**
	 * true while the tool keeps an editable object on preview that outlives the
	 * gesture: a shape waiting for Enter, a selection waiting to be dropped.
	 */
	isPending?(ctx: ToolContext): boolean
	/** does the point land on what the tool is holding? */
	hitTest?(pt: Point, ctx: ToolContext): boolean
	/** bakes the held object; the engine snapshots and flattens around it. */
	commit?(ctx: ToolContext): void
	/** redraws the held object after a colour, size or style change. */
	repaint?(ctx: ToolContext): void
	/**
	 * css cursor for the pixel under the pointer, or null for the tool's own.
	 * a resize arrow says which way a handle drags, which no drawn glyph can.
	 */
	cursorAt?(pt: Point, ctx: ToolContext): string | null
	/**
	 * draws hover guidance on the overlay, in css pixels relative to the pane.
	 * a tool that declares it gets called on every pointer move.
	 */
	paintOverlay?(screen: Point, ctx: ToolContext): void
}

/** one undo step over part of the bitmap, as it was before the stroke. */
export interface HistoryTiles {
	label: string
	kind: "tiles"
	/** the document size the tile grid was cut against. */
	docSize: Size
	tiles: Map<number, ImageData>
}

/** one undo step over the whole bitmap, which a size change has to record. */
export interface HistoryFull {
	label: string
	kind: "full"
	/** the picture as it was, carrying the size to go back to. */
	image: ImageData
}

export type HistoryEntry = HistoryTiles | HistoryFull

/** which way a flip folds the picture. */
export type FlipAxis = "h" | "v"

/** what Resize and Skew asks for: two scale factors and two shear angles. */
export interface TransformSpec {
	scaleX: number
	scaleY: number
	/** degrees, limited to the open range between -90 and 90. */
	skewH: number
	skewV: number
}

/** swaps a picture for another one; every image operation is one of these. */
export type ImageRecipe = (source: HTMLCanvasElement) => HTMLCanvasElement

/** one cubic or straight step of a normalised shape outline. */
export interface ShapeSegment {
	to: Point
	/** both control points, or neither: a segment with none is a line. */
	c1?: Point
	c2?: Point
}

export interface ShapeSubpath {
	start: Point
	segments: ShapeSegment[]
	closed: boolean
}

/** one gallery shape, drawn in the unit box and scaled into the drag box. */
export interface ShapeDef {
	/** null when the shape follows drawn points rather than a box. */
	outline: ShapeSubpath[] | null
	/** true when the shape has an interior that Fill can paint. */
	fillable: boolean
	/** true when it takes more than one gesture: curve and polygon. */
	multiStep: boolean
}

/** a free-form selection keeps the drawn path, with the rule that fills it. */
export interface SelectionMask {
	path: Path2D
	rule: CanvasFillRule
}

/** what the canvas draws around an unfinished object, in image pixels. */
export interface OverlayShape {
	/** dashed box, absent for a line or a curve. */
	bounds: Rect | null
	handles: Point[]
}

export interface OverlayState {
	/** marching ants, live while a marquee or a floating selection moves. */
	selection: Rect | null
	/** the traced corners of a free-form selection; null when it is a box. */
	lasso: Point[] | null
	/** the eight handles of a settled selection, absent while one is drawn. */
	grips: Point[] | null
	draft: OverlayShape | null
	/** the open text box, which react fills with a real textarea. */
	text: Rect | null
}

/** the shape sitting on preview, still editable until it is baked. */
export interface ShapeDraft {
	kind: ShapeKind
	/** the right button swaps the outline and fill colours. */
	swapped: boolean
	box: Rect
	/** the ends of a line or a curve, which a box cannot describe. */
	from: Point
	to: Point
	controls: Point[]
	points: Point[]
	/** a polygon still collecting corners. */
	open: boolean
}
