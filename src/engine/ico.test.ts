import { describe, expect, it } from "vitest"
import { iconSize, wrapIco } from "./ico"

describe("iconSize", () => {
	it("leaves a small picture alone", () => {
		expect(iconSize({ width: 32, height: 32 })).toEqual({
			width: 32,
			height: 32,
		})
		expect(iconSize({ width: 256, height: 100 })).toEqual({
			width: 256,
			height: 100,
		})
	})

	it("shrinks the longer side to 256 and the other in proportion", () => {
		expect(iconSize({ width: 1152, height: 648 })).toEqual({
			width: 256,
			height: 144,
		})
		expect(iconSize({ width: 100, height: 8000 })).toEqual({
			width: 3,
			height: 256,
		})
	})
})

describe("wrapIco", () => {
	const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])

	async function bytesOf(blob: Blob): Promise<number[]> {
		return [...new Uint8Array(await blob.arrayBuffer())]
	}

	it("writes the directory, one entry and the png after it", async () => {
		const bytes = await bytesOf(wrapIco(png, { width: 16, height: 9 }))
		expect(bytes.slice(0, 6)).toEqual([0, 0, 1, 0, 1, 0])
		expect(bytes.slice(6, 14)).toEqual([16, 9, 0, 0, 1, 0, 32, 0])
		expect(bytes.slice(14, 18)).toEqual([7, 0, 0, 0])
		expect(bytes.slice(18, 22)).toEqual([22, 0, 0, 0])
		expect(bytes.slice(22)).toEqual([...png])
	})

	it("writes a side of 256 as zero", async () => {
		const bytes = await bytesOf(wrapIco(png, { width: 256, height: 128 }))
		expect(bytes[6]).toBe(0)
		expect(bytes[7]).toBe(128)
	})
})
