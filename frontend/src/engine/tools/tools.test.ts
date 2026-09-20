import {
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest"
import { SPRAY_INTERVAL_MS } from "common/constant"
import { BrushTool } from "engine/tools/BrushTool"
import { EraserTool } from "engine/tools/EraserTool"
import { FillTool } from "engine/tools/FillTool"
import { MagnifierTool } from "engine/tools/MagnifierTool"
import { PencilTool } from "engine/tools/PencilTool"
import { PickerTool } from "engine/tools/PickerTool"
import { ShapeTool } from "engine/tools/ShapeTool"
import type { AppDispatch } from "store"
import type { Modifiers, ToolContext } from "types/engine.types"
import type { Rect } from "types/store.types"

const BLACK = "#000000"
const WHITE = "#ffffff"
const RED = "#ed1c24"
const BLUE = "#00a2e8"
const DOC = 4

/** node carries no Path2D, and a shape only ever builds one to hand it over. */
class PathStub {
	moveTo() {}
	lineTo() {}
	bezierCurveTo() {}
	closePath() {}
	rect() {}
	addPath() {}
}

globalThis.Path2D ??= PathStub as unknown as typeof Path2D

interface Stamp {
	x: number
	y: number
	w: number
	h: number
	style: string
}

/** one whole path laid down, which is how a shape reaches the canvas. */
interface Painted {
	kind: "fill" | "stroke"
	style: string
}

interface Harness {
	ctx: ToolContext
	stamps: Stamp[]
	strokes: Stamp[]
	painted: Painted[]
	dirty: Rect[]
	dispatched: { type: string; payload: unknown }[]
	puts: Rect[]
	pixels: Uint8ClampedArray
}

const LEFT: Modifiers = {
	secondary: false,
	shift: false,
	alt: false,
	ctrl: false,
}
const RIGHT: Modifiers = { ...LEFT, secondary: true }
const SHIFT: Modifiers = { ...LEFT, shift: true }

/**
 * a tool only ever touches its context; the whole of one stands up from
 * arrays: what it stamped, what it snapshotted, what it dispatched.
 */
function harness(
	size = 1,
	zoom = 1,
	overrides: Partial<ToolContext> = {},
): Harness {
	const stamps: Stamp[] = []
	const strokes: Stamp[] = []
	const painted: Painted[] = []
	const dirty: Rect[] = []
	const dispatched: { type: string; payload: unknown }[] = []
	const puts: Rect[] = []
	const pixels = new Uint8ClampedArray(DOC * DOC * 4)
	for (let i = 0; i < DOC * DOC; i++) pixels.set([255, 255, 255, 255], i * 4)

	const recorder = {
		fillStyle: "",
		strokeStyle: "",
		lineWidth: 1,
		lineJoin: "",
		lineCap: "",
		globalAlpha: 1,
		globalCompositeOperation: "source-over",
		filter: "none",
		save() {},
		restore() {},
		translate() {},
		rotate() {},
		beginPath() {},
		moveTo() {},
		lineTo() {},
		arc() {},
		createPattern: () => null,
		fill() {
			painted.push({ kind: "fill", style: this.fillStyle })
		},
		stroke() {
			painted.push({ kind: "stroke", style: this.strokeStyle })
		},
		fillRect(x: number, y: number, w: number, h: number) {
			stamps.push({ x, y, w, h, style: this.fillStyle })
		},
		strokeRect(x: number, y: number, w: number, h: number) {
			strokes.push({ x, y, w, h, style: this.strokeStyle })
		},
		putImageData(
			_image: ImageData,
			_x: number,
			_y: number,
			x: number,
			y: number,
			w: number,
			h: number,
		) {
			puts.push({ x, y, w, h })
		},
	}

	const surface = {
		readRegion({
			x,
			y,
			w,
			h,
		}: Rect) {
			const data = new Uint8ClampedArray(w * h * 4)
			for (let row = 0; row < h; row++) {
				const from = ((y + row) * DOC + x) * 4
				data.set(pixels.subarray(from, from + w * 4), row * w * 4)
			}
			return { data, width: w, height: h } as ImageData
		},
		writeRegion(image: ImageData, x: number, y: number) {
			const stride = image.width * 4
			for (let row = 0; row < image.height; row++) {
				const to = ((y + row) * DOC + x) * 4
				pixels.set(image.data.subarray(row * stride, (row + 1) * stride), to)
			}
		},
		readPixel(x: number, y: number) {
			const i = (y * DOC + x) * 4
			return {
				r: pixels[i],
				g: pixels[i + 1],
				b: pixels[i + 2],
				a: pixels[i + 3],
			}
		},
		clearPreview() {},
	}

	const ctx = {
		base: recorder,
		preview: recorder,
		overlay: recorder,
		surface,
		color1: BLACK,
		color2: WHITE,
		size,
		zoom,
		shape: "rect",
		brush: "brush",
		outline: "solid",
		fill: "none",
		doc: { width: DOC, height: DOC },
		dispatch: ((action: { type: string; payload: unknown }) =>
			dispatched.push(action)) as unknown as AppDispatch,
		markDirty: (rect: Rect) => dirty.push(rect),
		defer: () => undefined,
		...overrides,
	} as unknown as ToolContext

	return {
		ctx,
		stamps,
		strokes,
		painted,
		dirty,
		dispatched,
		puts,
		pixels,
	}
}

function at(h: Harness, x: number, y: number): number[] {
	const i = (y * DOC + x) * 4
	return [...h.pixels.subarray(i, i + 4)]
}

describe("PencilTool", () => {
	let h: Harness

	beforeEach(() => {
		h = harness()
	})

	it("stamps one pixel on a click and snapshots just that pixel", () => {
		new PencilTool().begin({ x: 1, y: 1 }, LEFT, h.ctx)

		expect(h.stamps).toEqual([{ x: 1, y: 1, w: 1, h: 1, style: BLACK }])
		expect(h.dirty).toEqual([{ x: 1, y: 1, w: 1, h: 1 }])
	})

	it("fills the gap between two pointer reports", () => {
		const pencil = new PencilTool()
		pencil.begin({ x: 0, y: 1 }, LEFT, h.ctx)
		pencil.update([{ x: 3, y: 1 }], LEFT, h.ctx)

		expect(h.stamps.map(s => s.x)).toEqual([0, 0, 1, 2, 3])
	})

	it("paints colour 2 when the gesture began on the right button", () => {
		new PencilTool().begin({ x: 1, y: 1 }, RIGHT, h.ctx)
		expect(h.stamps[0].style).toBe(WHITE)
	})

	it("holds the line on one axis while shift is down", () => {
		const pencil = new PencilTool()
		pencil.begin({ x: 0, y: 0 }, SHIFT, h.ctx)
		pencil.update([{ x: 3, y: 1 }], SHIFT, h.ctx)

		expect(h.stamps.every(s => s.y === 0)).toBe(true)
	})
})

describe("BrushTool", () => {
	it("strokes with colour 1, and with colour 2 on the right button", () => {
		const left = harness()
		const right = harness()
		new BrushTool().begin({ x: 1, y: 1 }, LEFT, left.ctx)
		new BrushTool().begin({ x: 1, y: 1 }, RIGHT, right.ctx)

		expect(left.painted[0].style).toBe(BLACK)
		expect(right.painted[0].style).toBe(WHITE)
	})

	it("stamps a flat nib instead of stroking for a calligraphy brush", () => {
		const h = harness(3, 1, { brush: "calligraphy1" })
		new BrushTool().begin({ x: 1, y: 1 }, LEFT, h.ctx)

		expect(h.painted).toEqual([])
		expect(h.stamps.length).toBeGreaterThan(0)
	})

	it("snapshots the whole disc an airbrush scatters into", () => {
		const h = harness(1, 1, { brush: "airbrush" })
		new BrushTool().begin({ x: 2, y: 2 }, LEFT, h.ctx)

		expect(h.dirty[0]).toEqual({ x: 0, y: 0, w: 4, h: 4 })
	})

	it("keeps an airbrush spraying while held and stops it at the end", () => {
		vi.useFakeTimers()
		const h = harness(1, 1, { brush: "airbrush" })
		const brush = new BrushTool()

		brush.begin({ x: 2, y: 2 }, LEFT, h.ctx)
		const sprayed = h.stamps.length
		vi.advanceTimersByTime(SPRAY_INTERVAL_MS * 3)
		const held = h.stamps.length
		expect(held).toBeGreaterThan(sprayed)

		brush.end()
		vi.advanceTimersByTime(SPRAY_INTERVAL_MS * 3)
		expect(h.stamps.length).toBe(held)
		vi.useRealTimers()
	})
})

describe("EraserTool", () => {
	it("paints colour 2 rather than cutting a hole", () => {
		const h = harness()
		new EraserTool().begin({ x: 2, y: 2 }, LEFT, h.ctx)

		expect(h.stamps).toEqual([{ x: 2, y: 2, w: 1, h: 1, style: WHITE }])
	})

	it("draws a cursor the size of the square it will clear", () => {
		const h = harness(8, 2)
		new EraserTool().paintOverlay({ x: 50, y: 50 }, h.ctx)

		// an 8px brush at 200% covers sixteen screen pixels
		expect(h.strokes.map(s => s.w)).toEqual([17, 16])
	})

	it("replaces only colour 1 on the right button", () => {
		const h = harness(3)
		h.pixels.set([0, 0, 0, 255], (1 * DOC + 1) * 4) // one colour 1 pixel
		h.pixels.set([255, 0, 0, 255], (1 * DOC + 2) * 4) // and one that is not

		new EraserTool().begin({ x: 1, y: 1 }, RIGHT, h.ctx)

		expect(at(h, 1, 1)).toEqual([255, 255, 255, 255])
		expect(at(h, 2, 1)).toEqual([255, 0, 0, 255])
		expect(h.stamps).toEqual([]) // the replacer works on base, not preview
	})
})

describe("FillTool", () => {
	it("snapshots before writing, and writes back only the filled box", () => {
		const h = harness()
		new FillTool().begin({ x: 0, y: 0 }, LEFT, h.ctx)

		expect(h.dirty).toEqual([{ x: 0, y: 0, w: DOC, h: DOC }])
		expect(h.puts).toEqual([{ x: 0, y: 0, w: DOC, h: DOC }])
	})

	it("does nothing when the colour is already there", () => {
		const h = harness()
		new FillTool().begin({ x: 0, y: 0 }, RIGHT, h.ctx) // white on white

		expect(h.dirty).toEqual([])
		expect(h.puts).toEqual([])
	})

	it("ignores a click outside the picture", () => {
		const h = harness()
		new FillTool().begin({ x: DOC, y: 0 }, LEFT, h.ctx)

		expect(h.puts).toEqual([])
	})
})

describe("PickerTool", () => {
	it("reads the pixel into the swatch the button names", () => {
		const h = harness()
		h.pixels.set([34, 177, 76, 255], (2 * DOC + 2) * 4)

		new PickerTool().begin({ x: 2, y: 2 }, RIGHT, h.ctx)

		expect(h.dispatched).toEqual([
			{ type: "picker/picked", payload: { which: "color2", hex: "#22b14c" } },
		])
	})

	it("stays quiet outside the picture", () => {
		const h = harness()
		new PickerTool().begin({ x: -1, y: 2 }, LEFT, h.ctx)

		expect(h.dispatched).toEqual([])
	})
})

describe("MagnifierTool", () => {
	it("steps up to the next level about the clicked pixel", () => {
		const h = harness(1, 2)
		new MagnifierTool().begin({ x: 3, y: 1 }, LEFT, h.ctx)

		expect(h.dispatched).toEqual([
			{ type: "view/zoomAt", payload: { zoom: 4, at: { x: 3, y: 1 } } },
		])
	})

	it("steps back down on the right button", () => {
		const h = harness(1, 4)
		new MagnifierTool().begin({ x: 0, y: 0 }, RIGHT, h.ctx)

		expect(h.dispatched[0].payload).toEqual({ zoom: 2, at: { x: 0, y: 0 } })
	})

	it("has nowhere to go past the top level", () => {
		const h = harness(1, 8)
		new MagnifierTool().begin({ x: 0, y: 0 }, LEFT, h.ctx)

		expect(h.dispatched).toEqual([])
	})
})

describe("ShapeTool colours", () => {
	/** drags a rectangle out and reports what the last repaint laid down. */
	function draw(overrides: Partial<ToolContext>, mods = LEFT): Painted[] {
		const h = harness(1, 1, { color1: RED, color2: BLUE, ...overrides })
		const shape = new ShapeTool()
		shape.begin({ x: 0, y: 0 }, mods, h.ctx)
		// every gesture repaints the whole draft; only the latest one is on show
		h.painted.length = 0
		shape.update([{ x: 3, y: 3 }], mods, h.ctx)
		return h.painted
	}

	it("strokes the outline in colour 1", () => {
		expect(draw({})).toEqual([{ kind: "stroke", style: RED }])
	})

	it("fills the interior with colour 2 once a fill style is picked", () => {
		expect(draw({ fill: "solid" })).toEqual([
			{ kind: "fill", style: BLUE },
			{ kind: "stroke", style: RED },
		])
	})

	it("swaps the two when the drag began on the right button", () => {
		expect(draw({ fill: "solid" }, RIGHT)).toEqual([
			{ kind: "fill", style: RED },
			{ kind: "stroke", style: BLUE },
		])
	})

	it("leaves the interior alone while the fill style is none", () => {
		expect(draw({}).some(p => p.kind === "fill")).toBe(false)
	})
})
