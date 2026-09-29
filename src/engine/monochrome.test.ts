import { describe, expect, it } from "vitest"
import { ditherToMono } from "./monochrome"

/** an opaque picture filled with one gray level. */
function flat(width: number, height: number, level: number): Uint8ClampedArray {
	const pixels = new Uint8ClampedArray(width * height * 4)
	for (let i = 0; i < pixels.length; i += 4) {
		pixels[i] = level
		pixels[i + 1] = level
		pixels[i + 2] = level
		pixels[i + 3] = 255
	}
	return pixels
}

function whiteCount(pixels: Uint8ClampedArray): number {
	let count = 0
	for (let i = 0; i < pixels.length; i += 4) if (pixels[i] === 255) count++
	return count
}

describe("ditherToMono", () => {
	it("leaves black and white where they are", () => {
		const pixels = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255])
		ditherToMono(pixels, 2, 1)
		expect([...pixels]).toEqual([0, 0, 0, 255, 255, 255, 255, 255])
	})

	it("writes nothing but black and white, all of it opaque", () => {
		const pixels = flat(8, 8, 90)
		ditherToMono(pixels, 8, 8)
		for (let i = 0; i < pixels.length; i += 4) {
			expect(pixels[i] === 0 || pixels[i] === 255).toBe(true)
			expect(pixels[i + 1]).toBe(pixels[i])
			expect(pixels[i + 2]).toBe(pixels[i])
			expect(pixels[i + 3]).toBe(255)
		}
	})

	it("spreads a middle gray into about half white", () => {
		const pixels = flat(16, 16, 128)
		ditherToMono(pixels, 16, 16)
		const white = whiteCount(pixels)
		expect(white).toBeGreaterThan(96)
		expect(white).toBeLessThan(160)
	})

	it("keeps a dark gray mostly black", () => {
		const pixels = flat(16, 16, 32)
		ditherToMono(pixels, 16, 16)
		const white = whiteCount(pixels)
		expect(white).toBeGreaterThan(16)
		expect(white).toBeLessThan(48)
	})
})
