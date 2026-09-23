import {
	faEyeDropper,
	faFillDrip,
	faMagnifyingGlass,
	faPencil,
} from "@fortawesome/free-solid-svg-icons"
import type {
	BrushSpec,
	CursorArt,
	ShapeDef,
	ShapeSegment,
	ShapeSubpath,
	Size,
} from "types/engine.types"
import type { Language, LanguageDef } from "types/locales.types"
import type {
	BrushKind,
	ImageFormat,
	PaperSize,
	Point,
	PrintSetup,
	QatItemId,
	Settings,
	ShapeKind,
	StrokeStyle,
	ViewToggles,
} from "types/store.types"

/**
 * the one localStorage key keeps every setting the app lives under it.
 */
export const SETTINGS_STORAGE_KEY = "paint-web"

/** what the Show or hide checkboxes read before a visit has changed them. */
export const VIEW_TOGGLES_DEFAULT: ViewToggles = {
	showRuler: false,
	showGrid: false,
	showStatusBar: true,
}

/**
 * every Quick Access Toolbar button in its fixed order. a re-added one lands
 * back in place because this list, not the order of the clicks, decides.
 */
export const QAT_ORDER: QatItemId[] = [
	"new",
	"open",
	"save",
	"undo",
	"redo",
	"print-preview",
]

/** the three a first visit shows, which is what Paint puts there. */
export const QAT_DEFAULT: QatItemId[] = ["save", "undo", "redo"]

export const FALLBACK_LANGUAGE: Language = "en"

/** the order the language switcher lists them in. */
export const LANGUAGES: LanguageDef[] = [
	{ id: "en", labelKey: "filemenu.language.en" },
	{ id: "vi", labelKey: "filemenu.language.vi" },
]

/** the two browser probes run guarded: a node test imports this file as well. */
export const CAN_SAVE_IN_PLACE =
	typeof window !== "undefined" && "showSaveFilePicker" in window

/**
 * whether a worker can write png, jpeg and webp. without OffscreenCanvas the
 * only encoder is the main thread's, which an 8k picture holds for seconds.
 */
export const CAN_ENCODE_OFF_THREAD =
	typeof OffscreenCanvas !== "undefined" &&
	typeof OffscreenCanvas.prototype.convertToBlob === "function"

/** the canvas Paint opens with, which New goes back to. */
export const DEFAULT_DOCUMENT: Size = { width: 1152, height: 648 }

/** what a first visit starts from, and what an unreadable store falls back to. */
export const SETTINGS_DEFAULT: Settings = {
	language: FALLBACK_LANGUAGE,
	qat: QAT_DEFAULT,
	pageSize: DEFAULT_DOCUMENT,
	thumbnailWidth: null,
	view: VIEW_TOGGLES_DEFAULT,
}

/**
 * the public page carrying the disclaimer, served beside the app. the file
 * name is named outright: only nginx maps the shorter /about onto it.
 */
export const INTRO_PAGE_URL = "/about.html"

/** bare paper, which is what a new or a widened document shows. */
export const PAPER_COLOR = "#ffffff"

/** Ctrl+click is the right button on macOS, and Cmd carries the shortcuts. */
export const IS_MAC =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent)

/**
 * shortcuts are written as canonical tokens, "Mod" being the modifier each
 * platform puts on the commands it shares with the OS. these tables turn a
 * token into the key name that platform prints.
 */
export const WINDOWS_KEY_LABELS: Record<string, string> = {
	Mod: "Ctrl",
}

/** macOS prints modifiers in this order, whichever order they were written. */
export const MAC_MODIFIER_ORDER = ["Ctrl", "Alt", "Shift", "Mod"]

/**
 * a browser keeps Ctrl+N and Cmd+N for its own new window and never hands the
 * key to the page, so Paint answers a different one on each platform.
 */
export const WINDOWS_SHORTCUT_OVERRIDES: Record<string, string> = {
	"Mod+N": "Mod+Alt+N",
}

export const MAC_SHORTCUT_OVERRIDES: Record<string, string> = {
	"Mod+N": "Ctrl+N",
}

/**
 * a Mac marks its modifiers with the symbols printed on the keys. a page key
 * is fn and an arrow, so it is written as the two keys it takes.
 */
export const MAC_KEY_LABELS: Record<string, string> = {
	Mod: "\u2318",
	Ctrl: "\u2303",
	Shift: "\u21e7",
	Alt: "\u2325",
	Del: "\u2326",
	PgUp: "fn + \u2191",
	PgDn: "fn + \u2193",
}

export const SHORTCUT_JOIN = " + "

export const SPELL_OUT_FROM = 3

export const MIME_TYPES: Record<ImageFormat, string> = {
	png: "image/png",
	jpeg: "image/jpeg",
	bmp: "image/bmp",
	gif: "image/gif",
	webp: "image/webp",
}

export const EXTENSIONS: Record<ImageFormat, string> = {
	png: ".png",
	jpeg: ".jpg",
	bmp: ".bmp",
	gif: ".gif",
	webp: ".webp",
}

export const FORMATS = Object.keys(MIME_TYPES) as ImageFormat[]

/** the default when a file arrives with a type the app does not write. */
export const DEFAULT_FORMAT: ImageFormat = "png"

/** the extra spellings a picker should still accept for a format. */
export const FORMAT_ALIASES: Partial<Record<ImageFormat, string[]>> = {
	jpeg: [".jpeg"],
	bmp: [".dib"],
}

/** past this the memory cost stops being worth it, and Paint has no use for it. */
export const MAX_DIMENSION = 8000

/**
 * squares the canvas probe tries at startup, smallest first. a browser refuses
 * by area rather than by side, and iOS Safari gives up first, near 4096 square.
 */
export const CANVAS_PROBE_SIDES = [2048, 4096, 8192, 11585, 16384]

/** what the probe falls back to where no canvas can be built, as in node. */
export const CANVAS_AREA_FALLBACK = 4096 * 4096

/** printable paper in millimetres, upright; landscape turns it on its side. */
export const PAPER_SIZES: Record<PaperSize, Size> = {
	a4: { width: 210, height: 297 },
	letter: { width: 216, height: 279 },
}

/** the keyword each paper goes by in a print stylesheet. */
export const PAPER_CSS_NAMES: Record<PaperSize, string> = {
	a4: "A4",
	letter: "Letter",
}

/** css fixes a picture at 96 dots per inch, which is its natural size on paper. */
export const CSS_DPI = 96

export const MM_PER_INCH = 25.4

export const DEFAULT_PRINT_SETUP: PrintSetup = {
	paper: "a4",
	orientation: "portrait",
	margins: { top: 10, right: 10, bottom: 10, left: 10 },
	centerH: true,
	centerV: true,
	fit: true,
	scale: 100,
}

/** a margin wider than this would leave no printable box on the page. */
export const MAX_MARGIN = 60

export const MAX_PRINT_SCALE = 400

/** how long the hidden print frame stays before it is taken down again. */
export const PRINT_RELEASE_MS = 1000

/** what the camera is asked for; it hands back the nearest size it has. */
export const CAMERA_IDEAL: Size = { width: 3840, height: 2160 }

/** raw pen pressure is noisy, and this is the weight one sample carries. */
export const PRESSURE_SMOOTHING = 0.3

/** a device that cannot measure force reports exactly this while touching. */
export const UNMEASURED_PRESSURE = 0.5

/** what a pen's lightest and heaviest touch do to opacity, width and rate. */
export const PRESSURE_ALPHA: [number, number] = [0.25, 1]
export const PRESSURE_WIDTH: [number, number] = [0.35, 1.25]
export const PRESSURE_RATE: [number, number] = [0.2, 1.15]

/** below this lean a pen counts as upright and the nib keeps its own angle. */
export const MIN_TILT = 5

/** chromium alone reports between frames; everything else waits for a move. */
export const HAS_RAW_POINTER =
	typeof window !== "undefined" && "onpointerrawupdate" in window

/** Paint's standard palette: 20 immutable colors. */
export const PAINT_PALETTE = [
	"#000000",
	"#7F7F7F",
	"#880015",
	"#ED1C24",
	"#FF7F27",
	"#FFF200",
	"#22B14C",
	"#00A2E8",
	"#3F48CC",
	"#A349A4",
	"#FFFFFF",
	"#C3C3C3",
	"#B97A57",
	"#FFAEC9",
	"#FFC90E",
	"#EFE4B0",
	"#B5E61D",
	"#99D9EA",
	"#7092BE",
	"#C8BFE7",
] as const

export const CUSTOM_SLOTS = 10

/** the eleven stops the zoom slider and Ctrl+plus step through. */
export const ZOOM_STEPS = [0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8]

/**
 * past this side the picture is drawn through a window onto what the viewport
 * shows: a bitmap this wide belongs nowhere near the dom.
 */
export const VIRTUAL_DOC_SIDE = 4000

/** from this zoom the scaled-up picture no longer belongs there either. */
export const VIRTUAL_ZOOM = 4

/** screen pixels held beyond the viewport, which covers a scroll mid-frame. */
export const VIRTUAL_PAD = 64

/** the eight handles of a box: four corners, then the edge midpoints. */
export const BOX_HANDLE_SPOTS: Point[] = [
	{ x: 0, y: 0 },
	{ x: 0.5, y: 0 },
	{ x: 1, y: 0 },
	{ x: 0, y: 0.5 },
	{ x: 1, y: 0.5 },
	{ x: 0, y: 1 },
	{ x: 0.5, y: 1 },
	{ x: 1, y: 1 },
]

/** how close the pointer has to come to a handle, in screen pixels. */
export const GRIP_REACH = 7

/** the arrow each of those eight handles drags along, in the same order. */
export const BOX_CURSORS = [
	"nwse-resize",
	"ns-resize",
	"nesw-resize",
	"ew-resize",
	"ew-resize",
	"nesw-resize",
	"ns-resize",
	"nwse-resize",
]

/** the pointer is over something it can pick up and carry. */
export const MOVE_CURSOR = "move"

/**
 * every field the app draws turns the browser's own helpers off: the text box
 * over the picture was being offered saved addresses to complete.
 */
export const NO_AUTOFILL = {
	autoComplete: "off",
	autoCorrect: "off",
	autoCapitalize: "off",
	spellCheck: false,
} as const

/** a font size is given in points and every canvas measure is in pixels. */
export const POINT_TO_PIXEL = 96 / 72

/** line spacing of a text box, shared by the textarea and the baked text. */
export const TEXT_LINE_HEIGHT = 1.2

/** the gap Paint leaves between the text box edge and the first glyph. */
export const TEXT_PADDING = 1

/**
 * the band around a text box that drags it, in screen pixels.
 */
export const TEXT_GRAB_BAND = 5

/** a click that never became a drag opens a text box this big. */
export const TEXT_BOX_DEFAULT: Size = { width: 220, height: 26 }

/** either shear angle stops short of 90, where the matrix degenerates. */
export const MAX_SKEW = 89

/** the arrow keys nudge a selection one pixel at a time. */
export const NUDGE_KEYS: Record<string, Point | undefined> = {
	ArrowLeft: { x: -1, y: 0 },
	ArrowRight: { x: 1, y: 0 },
	ArrowUp: { x: 0, y: -1 },
	ArrowDown: { x: 0, y: 1 },
}

/**
 * the cursors are the ribbon's own glyphs: a hand-drawn lookalike drifts from
 * the toolbar the moment either side is touched. the hotspot is the tip.
 */
export const PENCIL_CURSOR: CursorArt = {
	icon: faPencil,
	size: 20,
	hotX: 0.04,
	hotY: 0.95,
}

export const FILL_CURSOR: CursorArt = {
	icon: faFillDrip,
	size: 22,
	hotX: 0.72,
	hotY: 0.62,
}

export const PICKER_CURSOR: CursorArt = {
	icon: faEyeDropper,
	size: 20,
	hotX: 0.04,
	hotY: 0.95,
}

export const MAGNIFIER_CURSOR: CursorArt = {
	icon: faMagnifyingGlass,
	size: 20,
	hotX: 0.34,
	hotY: 0.34,
}

/**
 * the 9 brushes, every measure relative to the chosen size.
 */
export const BRUSH_SPECS: Record<BrushKind, BrushSpec> = {
	brush: { width: 2, alpha: 1 },
	calligraphy1: { width: 2, alpha: 1, nib: { angle: -45, thickness: 0.25 } },
	calligraphy2: { width: 2, alpha: 1, nib: { angle: 45, thickness: 0.25 } },
	airbrush: { width: 1, alpha: 0.08, spray: { radius: 3, rate: 40 } },
	oil: { width: 1.6, alpha: 0.4, passes: 5, jitter: 0.6, dry: 0.45 },
	crayon: { width: 2, alpha: 0.6, grain: true },
	marker: { width: 2, alpha: 0.4, multiply: true },
	"natural-pencil": { width: 1, alpha: 0.9, speed: [0.9, 0.5] },
	watercolor: { width: 3, alpha: 0.05, passes: 3, blur: 1 },
}

/** the outline and fill textures of the shape gallery, named after brushes. */
export const STROKE_TEXTURES: Partial<Record<StrokeStyle, BrushKind>> = {
	crayon: "crayon",
	marker: "marker",
	oil: "oil",
	"natural-pencil": "natural-pencil",
	watercolor: "watercolor",
}

/** side of the pre-rendered noise tile; building one per frame is fatal. */
export const GRAIN_TILE = 24

/** share of the tile a crayon leaves colored, the rest showing through. */
export const GRAIN_DENSITY = 0.55

/** the airbrush keeps spraying on a held button, at about one frame apart. */
export const SPRAY_INTERVAL_MS = 16

/** pointer travel between samples that counts as full speed, in pixels. */
export const BRUSH_FULL_SPEED = 14

/** stroke length over which an oil brush runs down to its dry opacity. */
export const BRUSH_DRY_LENGTH = 600

const DEG = Math.PI / 180

/** where the callout tail meets the oval, measured with y pointing down. */
const OVAL_TAIL_FROM = 160
const OVAL_TAIL_TO = 125

/** nine bumps read as a cloud; fewer look like a flower. */
const CLOUD_BUMPS = 9
const CLOUD_BULGE = 0.5

function at(x: number, y: number): Point {
	return { x, y }
}

/** straight steps through a list of corners. */
function polyline(points: Point[], closed = true): ShapeSubpath {
	const [start, ...rest] = points
	return { start, segments: rest.map(to => ({ to })), closed }
}

/** the angles an arc is cut at: every quarter turn it crosses, then its end. */
function arcStops(from: number, to: number): number[] {
	const stops: number[] = []
	let angle = from

	while (angle < to) {
		angle = Math.min((Math.floor(angle / 90) + 1) * 90, to)
		stops.push(angle)
	}

	return stops
}

/**
 * cubic approximation of an elliptical arc, clockwise, in degrees with y down.
 * cutting it on the quarter turns puts a corner on each end of the box.
 */
function arc(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
	from: number,
	to: number,
): ShapeSegment[] {
	const segments: ShapeSegment[] = []
	let a = from * DEG

	for (const stop of arcStops(from, to)) {
		const b = stop * DEG
		const alpha = (4 / 3) * Math.tan((b - a) / 4)
		const pa = at(cx + rx * Math.cos(a), cy + ry * Math.sin(a))
		const pb = at(cx + rx * Math.cos(b), cy + ry * Math.sin(b))
		segments.push({
			to: pb,
			c1: at(pa.x - alpha * rx * Math.sin(a), pa.y + alpha * ry * Math.cos(a)),
			c2: at(pb.x + alpha * rx * Math.sin(b), pb.y - alpha * ry * Math.cos(b)),
		})
		a = b
	}

	return segments
}

function ellipse(cx: number, cy: number, rx: number, ry: number): ShapeSubpath {
	return {
		start: at(cx + rx, cy),
		segments: arc(cx, cy, rx, ry, 0, 360),
		closed: true,
	}
}

/** regular star of `points` tips, the dents at `inner` of the outer radius. */
function star(points: number, inner: number): ShapeSubpath {
	const corners: Point[] = []

	for (let i = 0; i < points * 2; i++) {
		const radius = i % 2 ? 0.5 * inner : 0.5
		const angle = (-90 + (i * 180) / points) * DEG
		corners.push(
			at(0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)),
		)
	}

	return polyline(corners)
}

/**
 * box with elliptical corners between `top` and `bottom`, clockwise from the
 * top left. `tail` is walked along the bottom edge, which runs right to left.
 */
function roundedBox(
	top: number,
	bottom: number,
	rx: number,
	ry: number,
	tail: Point[] = [],
): ShapeSubpath {
	return {
		start: at(rx, top),
		segments: [
			{ to: at(1 - rx, top) },
			...arc(1 - rx, top + ry, rx, ry, -90, 0),
			{ to: at(1, bottom - ry) },
			...arc(1 - rx, bottom - ry, rx, ry, 0, 90),
			...tail.map(to => ({ to })),
			{ to: at(rx, bottom) },
			...arc(rx, bottom - ry, rx, ry, 90, 180),
			{ to: at(0, top + ry) },
			...arc(rx, top + ry, rx, ry, 180, 270),
		],
		closed: true,
	}
}

/**
 * the body of the cloud: bumps bowing outwards between points on an oval.
 * the radii leave room for the bumps, which is what keeps it inside the box.
 */
function cloudBody(
	cx: number,
	cy: number,
	rx: number,
	ry: number,
): ShapeSubpath {
	const corners: Point[] = []
	for (let i = 0; i < CLOUD_BUMPS; i++) {
		const angle = ((i * 360) / CLOUD_BUMPS) * DEG
		corners.push(at(cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)))
	}

	const segments: ShapeSegment[] = []
	for (let i = 0; i < CLOUD_BUMPS; i++) {
		const a = corners[i]
		const b = corners[(i + 1) % CLOUD_BUMPS]
		const mx = (a.x + b.x) / 2 - cx
		const my = (a.y + b.y) / 2 - cy
		const radial = Math.hypot(mx, my) || 1
		const bulge = CLOUD_BULGE * Math.hypot(b.x - a.x, b.y - a.y)
		const ox = (mx / radial) * bulge
		const oy = (my / radial) * bulge

		segments.push({
			to: b,
			c1: at(a.x + (b.x - a.x) * 0.25 + ox, a.y + (b.y - a.y) * 0.25 + oy),
			c2: at(a.x + (b.x - a.x) * 0.75 + ox, a.y + (b.y - a.y) * 0.75 + oy),
		})
	}

	return { start: corners[0], segments, closed: true }
}

/** the oval body with the tail spliced into its lower left. */
function ovalCallout(): ShapeSubpath {
	const cy = 0.39
	const ry = 0.39
	const tip = at(0.06, 1)

	return {
		start: at(
			0.5 + 0.5 * Math.cos(OVAL_TAIL_FROM * DEG),
			cy + ry * Math.sin(OVAL_TAIL_FROM * DEG),
		),
		segments: [
			...arc(0.5, cy, 0.5, ry, OVAL_TAIL_FROM, OVAL_TAIL_TO + 360),
			{ to: tip },
		],
		closed: true,
	}
}

const ARROW_RIGHT: Point[] = [
	at(0, 0.3),
	at(0.55, 0.3),
	at(0.55, 0),
	at(1, 0.5),
	at(0.55, 1),
	at(0.55, 0.7),
	at(0, 0.7),
]

/** mirrors a unit-box outline through the middle of the box. */
function mirror(points: Point[], axis: "x" | "y"): Point[] {
	return points.map(p => (axis === "x" ? at(1 - p.x, p.y) : at(p.x, 1 - p.y)))
}

/** turns a unit-box outline on its side, which is how the arrows relate. */
function transpose(points: Point[]): Point[] {
	return points.map(p => at(p.y, p.x))
}

/** the 23 gallery shapes; line, curve and polygon follow drawn points. */
export const SHAPE_DEFS: Record<ShapeKind, ShapeDef> = {
	line: { outline: null, fillable: false, multiStep: false },
	curve: { outline: null, fillable: false, multiStep: true },
	oval: {
		outline: [ellipse(0.5, 0.5, 0.5, 0.5)],
		fillable: true,
		multiStep: false,
	},
	rect: {
		outline: [polyline([at(0, 0), at(1, 0), at(1, 1), at(0, 1)])],
		fillable: true,
		multiStep: false,
	},
	"rounded-rect": {
		outline: [roundedBox(0, 1, 0.14, 0.14)],
		fillable: true,
		multiStep: false,
	},
	polygon: { outline: null, fillable: true, multiStep: true },
	"right-triangle": {
		outline: [polyline([at(0, 0), at(0, 1), at(1, 1)])],
		fillable: true,
		multiStep: false,
	},
	triangle: {
		outline: [polyline([at(0.5, 0), at(1, 1), at(0, 1)])],
		fillable: true,
		multiStep: false,
	},
	diamond: {
		outline: [polyline([at(0.5, 0), at(1, 0.5), at(0.5, 1), at(0, 0.5)])],
		fillable: true,
		multiStep: false,
	},
	pentagon: {
		outline: [
			polyline([at(0.5, 0), at(1, 0.4), at(0.81, 1), at(0.19, 1), at(0, 0.4)]),
		],
		fillable: true,
		multiStep: false,
	},
	hexagon: {
		outline: [
			polyline([
				at(0.28, 0),
				at(0.72, 0),
				at(1, 0.5),
				at(0.72, 1),
				at(0.28, 1),
				at(0, 0.5),
			]),
		],
		fillable: true,
		multiStep: false,
	},
	"arrow-right": {
		outline: [polyline(ARROW_RIGHT)],
		fillable: true,
		multiStep: false,
	},
	"arrow-left": {
		outline: [polyline(mirror(ARROW_RIGHT, "x"))],
		fillable: true,
		multiStep: false,
	},
	"arrow-up": {
		outline: [polyline(mirror(transpose(ARROW_RIGHT), "y"))],
		fillable: true,
		multiStep: false,
	},
	"arrow-down": {
		outline: [polyline(transpose(ARROW_RIGHT))],
		fillable: true,
		multiStep: false,
	},
	"star-4": { outline: [star(4, 0.36)], fillable: true, multiStep: false },
	"star-5": { outline: [star(5, 0.382)], fillable: true, multiStep: false },
	"star-6": { outline: [star(6, 0.577)], fillable: true, multiStep: false },
	"callout-rounded": {
		outline: [
			roundedBox(0, 0.74, 0.12, 0.16, [
				at(0.44, 0.74),
				at(0.2, 1),
				at(0.3, 0.74),
			]),
		],
		fillable: true,
		multiStep: false,
	},
	"callout-oval": {
		outline: [ovalCallout()],
		fillable: true,
		multiStep: false,
	},
	"callout-cloud": {
		outline: [
			cloudBody(0.5, 0.34, 0.4, 0.3),
			ellipse(0.2, 0.83, 0.08, 0.08),
			ellipse(0.07, 0.95, 0.05, 0.05),
		],
		fillable: true,
		multiStep: false,
	},
	heart: {
		outline: [
			{
				start: at(0.5, 1),
				segments: [
					{ to: at(0.115, 0.19), c1: at(0.1, 0.66), c2: at(0, 0.41) },
					{ to: at(0.5, 0.22), c1: at(0.22, 0), c2: at(0.42, 0.02) },
					{ to: at(0.885, 0.19), c1: at(0.58, 0.02), c2: at(0.78, 0) },
					{ to: at(0.5, 1), c1: at(1, 0.41), c2: at(0.9, 0.66) },
				],
				closed: true,
			},
		],
		fillable: true,
		multiStep: false,
	},
	lightning: {
		outline: [
			polyline([
				at(0.67, 0),
				at(0, 0.55),
				at(0.42, 0.55),
				at(0.25, 1),
				at(1, 0.4),
				at(0.54, 0.4),
				at(0.75, 0),
			]),
		],
		fillable: true,
		multiStep: false,
	},
}
