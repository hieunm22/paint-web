import { describe, expect, it } from "vitest"
import { encodeBmp24 } from "engine/bmp"

/** node has no ImageData; the encoder only reads data, width and height. */
function sheet(width: number, height: number, rgb: number[][]): ImageData {
	const data = new Uint8ClampedArray(width * height * 4)
	rgb.forEach(([r, g, b], i) => data.set([r, g, b, 255], i * 4))
	return { data, width, height } as ImageData
}

async function bytesOf(image: ImageData): Promise<Uint8Array> {
	return new Uint8Array(await encodeBmp24(image).arrayBuffer())
}

describe("encodeBmp24", () => {
	it("writes the signature and the declared sizes", async () => {
		const bytes = await bytesOf(sheet(2, 2, [[1, 2, 3]]))
		const view = new DataView(bytes.buffer)

		// 2 px of 3 bytes pads to 8, twice over for two rows
		expect(bytes[0]).toBe(0x42)
		expect(bytes[1]).toBe(0x4d)
		expect(view.getUint32(2, true)).toBe(54 + 16)
		expect(view.getUint32(10, true)).toBe(54)
		expect(view.getInt32(18, true)).toBe(2)
		expect(view.getInt32(22, true)).toBe(2)
		expect(view.getUint16(28, true)).toBe(24)
	})

	it("stores rows bottom-up in BGR order", async () => {
		const red = [255, 0, 0]
		const blue = [0, 0, 255]
		const bytes = await bytesOf(sheet(1, 2, [red, blue]))

		// the last source row lands first, and each pixel reverses to BGR
		expect([...bytes.slice(54, 57)]).toEqual([255, 0, 0])
		expect([...bytes.slice(58, 61)]).toEqual([0, 0, 255])
	})

	it("pads every row out to a multiple of four bytes", async () => {
		const bytes = await bytesOf(sheet(3, 1, [[9, 9, 9]]))

		// 3 px of 3 bytes is 9, padded to 12
		expect(bytes.length).toBe(54 + 12)
		expect([...bytes.slice(63, 66)]).toEqual([0, 0, 0])
	})
})
