import {
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest"
import { History } from "engine/History"
import type { Surface } from "engine/Surface"
import type { Rect } from "types/store.types"

/**
 * stand-in for the canvas surface: History only ever asks for the document
 * size and copies boxes of pixels in and out, which a flat array can do.
 */
function fakeSurface(width: number, height: number) {
	return {
		pixels: new Uint8ClampedArray(width * height * 4),
		documentSize: { width, height },

		readRegion({
			x,
			y,
			w,
			h,
		}: Rect): ImageData {
			const stride = this.documentSize.width * 4
			const data = new Uint8ClampedArray(w * h * 4)
			for (let row = 0; row < h; row++) {
				const from = (y + row) * stride + x * 4
				data.set(this.pixels.subarray(from, from + w * 4), row * w * 4)
			}
			return { data, width: w, height: h } as ImageData
		},

		writeRegion(data: ImageData, x: number, y: number): void {
			const stride = this.documentSize.width * 4
			const run = data.width * 4
			for (let row = 0; row < data.height; row++) {
				const to = (y + row) * stride + x * 4
				this.pixels.set(data.data.subarray(row * run, (row + 1) * run), to)
			}
		},

		restoreDocument(data: ImageData): void {
			this.documentSize = { width: data.width, height: data.height }
			this.pixels = new Uint8ClampedArray(data.data)
		},
	}
}

const DOC = 300
let surface: ReturnType<typeof fakeSurface>
let changed: ReturnType<typeof vi.fn>
let resized: ReturnType<typeof vi.fn>
let history: History

function paint(x: number, y: number, value: number): void {
	surface.pixels[(y * surface.documentSize.width + x) * 4] = value
}

function at(x: number, y: number): number {
	return surface.pixels[(y * surface.documentSize.width + x) * 4]
}

/** one stroke: snapshot the area, then write to it, the order tools must use. */
function stroke(
	x: number,
	y: number,
	value: number,
	label = "Pencil",
): boolean {
	history.beginStroke()
	history.touch({ x, y, w: 1, h: 1 })
	paint(x, y, value)
	return history.commitStroke(label)
}

beforeEach(() => {
	surface = fakeSurface(DOC, DOC)
	changed = vi.fn()
	resized = vi.fn()
	history = new History(surface as unknown as Surface, changed, resized)
})

describe("a committed stroke", () => {
	it("can be undone and redone", () => {
		expect(stroke(1, 1, 40)).toBe(true)
		expect(history.canUndo).toBe(true)
		expect(history.canRedo).toBe(false)

		expect(history.undo()).toBe(true)
		expect(at(1, 1)).toBe(0)
		expect(history.canRedo).toBe(true)

		expect(history.redo()).toBe(true)
		expect(at(1, 1)).toBe(40)
	})

	it("notifies once per change", () => {
		stroke(1, 1, 40)
		history.undo()
		history.redo()
		expect(changed).toHaveBeenCalledTimes(3)
	})

	it("restores tiles independently", () => {
		stroke(1, 1, 40)
		stroke(270, 270, 90) // a different tile of the 2x2 grid

		history.undo()
		expect(at(270, 270)).toBe(0)
		expect(at(1, 1)).toBe(40)
	})
})

describe("a stroke that changed nothing", () => {
	it("is not pushed and does not notify", () => {
		history.beginStroke()
		expect(history.commitStroke("Pick colour")).toBe(false)
		expect(history.canUndo).toBe(false)
		expect(changed).not.toHaveBeenCalled()
	})
})

describe("branching", () => {
	it("drops the redo stack as soon as a new stroke lands", () => {
		stroke(1, 1, 40)
		history.undo()
		expect(history.canRedo).toBe(true)

		stroke(2, 2, 70)
		expect(history.canRedo).toBe(false)
	})
})

describe("the 50 step limit", () => {
	it("drops the oldest step rather than the newest", () => {
		for (let i = 1; i <= 51; i++) stroke(1, 1, i)

		let undone = 0
		while (history.undo()) undone++

		expect(undone).toBe(50)
		// the first stroke fell out of the stack, so its value is what remains
		expect(at(1, 1)).toBe(1)
	})
})

describe("a full step, which a crop or a rotate pushes", () => {
	/** shrinks the document the way an image operation does. */
	function shrink(label: string): void {
		const before = surface.readRegion({ x: 0, y: 0, w: DOC, h: DOC })
		surface.restoreDocument({
			data: new Uint8ClampedArray(100 * 100 * 4),
			width: 100,
			height: 100,
		} as ImageData)
		history.pushFull(label, before)
	}

	it("puts the old size and its pixels back", () => {
		stroke(1, 1, 40)
		shrink("Crop")
		expect(surface.documentSize.width).toBe(100)

		history.undo()
		expect(surface.documentSize).toEqual({ width: DOC, height: DOC })
		expect(at(1, 1)).toBe(40)
		expect(resized).toHaveBeenCalledWith({ width: DOC, height: DOC })
	})

	it("redoes back to the cropped size", () => {
		shrink("Crop")
		history.undo()
		history.redo()
		expect(surface.documentSize).toEqual({ width: 100, height: 100 })
	})

	/** a tile id means nothing without the width its grid was cut against. */
	it("leaves the tile steps under it undoable", () => {
		stroke(1, 1, 40)
		shrink("Crop")

		history.undo()
		history.undo()
		expect(at(1, 1)).toBe(0)
	})
})

describe("clear", () => {
	it("empties both stacks, which a resize needs", () => {
		stroke(1, 1, 40)
		history.undo()
		history.clear()

		expect(history.canUndo).toBe(false)
		expect(history.canRedo).toBe(false)
	})
})
