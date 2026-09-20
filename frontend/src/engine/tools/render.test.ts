import { createCanvas } from "@napi-rs/canvas"
import { describe, expect, it } from "vitest"
import { PAPER_COLOR } from "common/constant"
import { EraserTool } from "engine/tools/EraserTool"
import { PencilTool } from "engine/tools/PencilTool"
import type { AppDispatch } from "store"
import type { Modifiers, StrokePoint, ToolContext } from "types/engine.types"
import type { Rect } from "types/store.types"

/**
 * these tools lay whole pixels down and antialias nothing, which is what lets
 * a hash of the result stand as a baseline across machines and skia versions.
 */
const DOC = { width: 64, height: 48 }
const RED = "#ed1c24"
const BLUE = "#00a2e8"

/** the stroke of the baseline test, as pixels covered and as a whole sheet. */
const INKED = 224
const BASELINE = "f0fd3045c9c7985b"

const LEFT: Modifiers = {
	secondary: false,
	shift: false,
	alt: false,
	ctrl: false,
}

/** one sample of a stroke; a mouse measures no force and leans nowhere. */
function sample(x: number, y: number): StrokePoint {
	return { x, y, pressure: null, tilt: null }
}

/** a real canvas behind the context, paper laid down as the surface does. */
function sheet() {
	const canvas = createCanvas(DOC.width, DOC.height)
	const ctx = canvas.getContext("2d")
	ctx.fillStyle = PAPER_COLOR
	ctx.fillRect(0, 0, DOC.width, DOC.height)
	return { canvas, ctx }
}

/**
 * a tool only ever touches its context, and here both picture layers are the
 * one canvas: what a tool draws is what the committed bitmap would hold.
 */
function harness(size: number) {
	const { canvas, ctx } = sheet()
	const dirty: Rect[] = []

	const surface = {
		readRegion: ({
			x,
			y,
			w,
			h,
		}: Rect) => ctx.getImageData(x, y, w, h),
		writeRegion: (image: ImageData, x: number, y: number) =>
			ctx.putImageData(image as never, x, y),
		clearPreview: () => undefined,
	}

	const tool = {
		base: ctx,
		preview: ctx,
		overlay: ctx,
		surface,
		color1: RED,
		color2: BLUE,
		size,
		zoom: 1,
		shape: "rect",
		brush: "brush",
		outline: "solid",
		fill: "none",
		doc: DOC,
		dispatch: (() => undefined) as unknown as AppDispatch,
		markDirty: (rect: Rect) => dirty.push(rect),
		defer: () => undefined,
	} as unknown as ToolContext

	return { canvas, ctx, tool, dirty }
}

/**
 * the committed pixels behind one short name. two FNV-1a streams, taken by
 * hand rather than through node's crypto: the tests build for the browser.
 */
function hashOf(ctx: ReturnType<typeof sheet>["ctx"]): string {
	const { data } = ctx.getImageData(0, 0, DOC.width, DOC.height)
	let low = 0x811c9dc5
	let high = 0x01000193

	for (let i = 0; i < data.length; i++) {
		low = Math.imul(low ^ data[i], 0x01000193)
		high = Math.imul(high ^ (data[i] + i), 0x01000193)
	}

	return [low, high].map(part => (part >>> 0).toString(16)).join("")
}

/** how much of the paper the stroke covered, which gives the hash a meaning. */
function inkedPixels(ctx: ReturnType<typeof sheet>["ctx"]): number {
	const { data } = ctx.getImageData(0, 0, DOC.width, DOC.height)
	let count = 0

	for (let i = 0; i < data.length; i += 4) {
		if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) count++
	}
	return count
}

function pixelAt(
	ctx: ReturnType<typeof sheet>["ctx"],
	x: number,
	y: number,
): number[] {
	return [...ctx.getImageData(x, y, 1, 1).data]
}

describe("pencil on a real canvas", () => {
	it("paints the pixels the path runs through and no others", () => {
		const { ctx, tool } = harness(1)
		const pencil = new PencilTool()

		pencil.begin(sample(8, 8), LEFT, tool)
		pencil.update([sample(12, 8), sample(12, 12)], LEFT, tool)

		expect(pixelAt(ctx, 8, 8)).toEqual([237, 28, 36, 255])
		expect(pixelAt(ctx, 10, 8)).toEqual([237, 28, 36, 255])
		expect(pixelAt(ctx, 12, 12)).toEqual([237, 28, 36, 255])
		// one row below the horizontal run is untouched paper
		expect(pixelAt(ctx, 10, 9)).toEqual([255, 255, 255, 255])
	})

	it("matches the baseline for a fixed stroke", () => {
		const { ctx, tool } = harness(3)
		const pencil = new PencilTool()

		pencil.begin(sample(6, 6), LEFT, tool)
		pencil.update(
			[sample(20, 6), sample(20, 20), sample(40, 33), sample(55, 33)],
			LEFT,
			tool,
		)

		// the count is what a reader can check; the hash catches the rest
		expect(inkedPixels(ctx)).toBe(INKED)
		expect(hashOf(ctx)).toBe(BASELINE)
	})
})

describe("eraser on a real canvas", () => {
	it("puts colour 2 back over what the pencil drew", () => {
		const { ctx, tool } = harness(1)
		const pencil = new PencilTool()
		const eraser = new EraserTool()

		pencil.begin(sample(8, 8), LEFT, tool)
		pencil.update([sample(16, 8)], LEFT, tool)
		eraser.begin(sample(12, 8), LEFT, tool)

		expect(pixelAt(ctx, 12, 8)).toEqual([0, 162, 232, 255])
		expect(pixelAt(ctx, 8, 8)).toEqual([237, 28, 36, 255])
	})
})
