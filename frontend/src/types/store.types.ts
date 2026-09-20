/** data model types, limited to what the UI layer needs. */

export type ImageFormat = "png" | "jpeg" | "bmp" | "gif" | "webp"

export type ToolId =
	| "pencil"
	| "fill"
	| "text"
	| "eraser"
	| "picker"
	| "magnifier"
	| "brush"
	| "shape"
	| "select-rect"
	| "select-free"

export type BrushKind =
	| "brush"
	| "calligraphy1"
	| "calligraphy2"
	| "airbrush"
	| "oil"
	| "crayon"
	| "marker"
	| "natural-pencil"
	| "watercolor"

export type ShapeKind =
	| "line"
	| "curve"
	| "oval"
	| "rect"
	| "rounded-rect"
	| "polygon"
	| "right-triangle"
	| "triangle"
	| "diamond"
	| "pentagon"
	| "hexagon"
	| "arrow-right"
	| "arrow-left"
	| "arrow-up"
	| "arrow-down"
	| "star-4"
	| "star-5"
	| "star-6"
	| "callout-rounded"
	| "callout-oval"
	| "callout-cloud"
	| "heart"
	| "lightning"

export type StrokeStyle =
	| "none"
	| "solid"
	| "crayon"
	| "marker"
	| "oil"
	| "natural-pencil"
	| "watercolor"

export type BrushSize = 1 | 3 | 5 | 8

/** "text" is contextual: it exists only while a text box is open. */
export type RibbonTabId = "home" | "view" | "text"

export interface Rect {
	x: number
	y: number
	w: number
	h: number
}
export interface Point {
	x: number
	y: number
}

export interface DocumentState {
	width: number
	height: number
	/** empty until the document is saved or opened; shown as "Untitled". */
	fileName: string
	format: ImageFormat
	isDirty: boolean
	/** when the file on disk was last written, shown in Properties. */
	savedAt: number | null
	dpi: number
}

/** everything a freshly opened file settles in the document slice at once. */
export interface OpenedPayload {
	width: number
	height: number
	fileName: string
	format: ImageFormat
	savedAt: number | null
}

export interface TextOptions {
	fontFamily: string
	fontSize: number
	bold: boolean
	italic: boolean
	underline: boolean
	strikethrough: boolean
	background: "transparent" | "opaque"
}

export interface ToolState {
	active: ToolId
	/** the tool the picker returns to once it has read a pixel. */
	prevTool: ToolId
	brush: BrushKind
	shape: ShapeKind
	size: BrushSize
	outline: StrokeStyle
	fill: StrokeStyle
	text: TextOptions
}

export type ColorSlotId = "color1" | "color2"

/** one pixel read by the colour picker, with the swatch it lands in. */
export interface PickedColor {
	which: ColorSlotId
	hex: string
}

export interface ColorState {
	color1: string
	color2: string
	editing: ColorSlotId
	palette: readonly string[]
	custom: (string | null)[]
}

/**
 * an image point the viewport should centre on, carrying the zoom it was asked
 * at: the effect that applies it must not fire again when zoom alone changes.
 */
export interface ZoomFocus {
	x: number
	y: number
	zoom: number
}

export interface ViewState {
	zoom: number
	focus: ZoomFocus | null
	showRuler: boolean
	showGrid: boolean
	showStatusBar: boolean
	showThumbnail: boolean
	fullScreen: boolean
}

export interface HistoryState {
	canUndo: boolean
	canRedo: boolean
	/** bumped on every committed step, which is what the size estimate watches. */
	revision: number
}

export type SelectionKind = "none" | "rect" | "free"

export interface SelectionState {
	kind: SelectionKind
	bounds: Rect | null
	transparent: boolean
}

export type PaperSize = "a4" | "letter"

export type PageOrientation = "portrait" | "landscape"

/** the four page margins, in millimetres. */
export interface PrintMargins {
	top: number
	right: number
	bottom: number
	left: number
}

/** what Page setup collects, and what the print stylesheet is written from. */
export interface PrintSetup {
	paper: PaperSize
	orientation: PageOrientation
	margins: PrintMargins
	centerH: boolean
	centerV: boolean
	/** shrinks a picture too big for the page; `scale` applies when it is off. */
	fit: boolean
	/** percent of the picture's natural size at 96 dots per inch. */
	scale: number
}

/** one margin field of Page setup, in whole millimetres. */
export interface MarginEdit {
	edge: keyof PrintMargins
	value: number
}

/** one of the two centring switches of Page setup. */
export interface CenteringEdit {
	axis: "centerH" | "centerV"
	on: boolean
}

/** the command the discard dialog is holding back until the user answers. */
export type PendingFileAction = "new" | "load" | "exit"

/** pure UI shell state; not part of the document data model. */
export interface UiState {
	tab: RibbonTabId
	/** true while the contextual Text tab is on the strip. */
	textTab: boolean
	/** the tab to go back to once the Text tab leaves again. */
	priorTab: RibbonTabId
	backstageOpen: boolean
	openMenu: string | null
	dialog: DialogId | null
	pending: PendingFileAction | null
	/** translation key of the transient notice, never the text itself. */
	toast: string | null
	/** which Quick Access Toolbar buttons are on show, in their fixed order. */
	qat: QatItemId[]
}

export type QatItemId =
	"new" | "open" | "save" | "undo" | "redo" | "print-preview"

export type DialogId =
	| "resize-skew"
	| "edit-colors"
	| "image-properties"
	| "save-as"
	| "confirm-discard"
	| "about"
	| "page-setup"
	| "print-preview"
	| "from-camera"
