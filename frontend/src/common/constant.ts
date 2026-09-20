import {
	faEyeDropper,
	faFillDrip,
	faMagnifyingGlass,
	faPencil,
} from "@fortawesome/pro-solid-svg-icons"
import type {
	CursorArt,
	ShapeDef,
	ShapeSegment,
	ShapeSubpath,
	Size,
} from "types/engine.types"
import type { Language, LanguageDef } from "types/locales.types"
import type {
	ImageFormat,
	Point,
	QatItemId,
	ShapeKind,
} from "types/store.types"

/** localStorage key holding the chosen language. */
export const LANGUAGE_STORAGE_KEY = "language"

/** localStorage key holding which Quick Access Toolbar buttons are on show. */
export const QAT_STORAGE_KEY = "qat"

/** the Quick Access Toolbar in its fixed order; all three start visible. */
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

/** the canvas Paint opens with, which New goes back to. */
export const DEFAULT_DOCUMENT: Size = { width: 1152, height: 648 }

/** Ctrl+click is the right button on macOS, and Cmd carries the shortcuts. */
export const IS_MAC =
	typeof navigator !== "undefined" &&
	/Mac|iPhone|iPad/.test(navigator.userAgent)

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

/** the arrow keys nudge a selection one pixel at a time. */
export const NUDGE_KEYS: Record<string, Point | undefined> = {
	ArrowLeft: { x: -1, y: 0 },
	ArrowRight: { x: 1, y: 0 },
	ArrowUp: { x: 0, y: -1 },
	ArrowDown: { x: 0, y: 1 },
}

/**
 * the cursors are the ribbon's own glyphs, taken from the icon package: a
 * hand-drawn lookalike drifts from the toolbar the moment either side is
 * touched. hotspots come from where each glyph's working end sits.
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
	return { start, segments: rest.map((to) => ({ to })), closed }
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
 * cubic approximation of an elliptical arc that turns clockwise from `from` to
 * `to`, in degrees with y pointing down. cutting it on the quarter turns puts
 * a corner on each end of the box, which is what makes the shape fill it.
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
			...tail.map((to) => ({ to })),
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
	return points.map((p) => (axis === "x" ? at(1 - p.x, p.y) : at(p.x, 1 - p.y)))
}

/** turns a unit-box outline on its side, which is how the arrows relate. */
function transpose(points: Point[]): Point[] {
	return points.map((p) => at(p.y, p.x))
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
		outline: [polyline(transpose(ARROW_RIGHT))],
		fillable: true,
		multiStep: false,
	},
	"arrow-down": {
		outline: [polyline(mirror(transpose(ARROW_RIGHT), "y"))],
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
