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
	const pixels = new Uint8ClampedArray(width * height * 4)

	return {
		pixels,
		documentSize: { width, height },
		readRegion({
			x,
			y,
			w,
			h,
		}: Rect): ImageData {
			const data = new Uint8ClampedArray(w * h * 4)
			for (let row = 0; row < h; row++) {
				const from = ((y + row) * width + x) * 4
				data.set(pixels.subarray(from, from + w * 4), row * w * 4)
			}
			return { data, width: w, height: h } as ImageData
		},
		writeRegion(data: ImageData, x: number, y: number): void {
			const stride = data.width * 4
			for (let row = 0; row < data.height; row++) {
				const to = ((y + row) * width + x) * 4
				pixels.set(data.data.subarray(row * stride, (row + 1) * stride), to)
			}
		},
	}
}

const DOC = 300
let surface: ReturnType<typeof fakeSurface>
let changed: ReturnType<typeof vi.fn>
let history: History

function paint(x: number, y: number, value: number): void {
	surface.pixels[(y * DOC + x) * 4] = value
}

function at(x: number, y: number): number {
	return surface.pixels[(y * DOC + x) * 4]
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
	history = new History(surface as unknown as Surface, changed)
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

describe("clear", () => {
	it("empties both stacks, which a resize needs", () => {
		stroke(1, 1, 40)
		history.undo()
		history.clear()

		expect(history.canUndo).toBe(false)
		expect(history.canRedo).toBe(false)
	})
})
