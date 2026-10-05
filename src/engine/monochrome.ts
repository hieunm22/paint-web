import { canvasOf } from "engine/transform"

/** the middle of the gray scale, where a pixel tips from black to white. */
const THRESHOLD = 128

/**
 * floyd-steinberg dithering to pure black and white, in place. each pixel
 * rounds to the nearer of the two and hands what it lost to its neighbors.
 */
export function ditherToMono(
	pixels: Uint8ClampedArray,
	width: number,
	height: number,
): void {
	const gray = new Float32Array(width * height)
	for (let i = 0; i < gray.length; i++) {
		const o = i * 4
		// rec. 601 luma, which is how the eye weighs the three channels
		gray[i] = 0.299 * pixels[o] + 0.587 * pixels[o + 1] + 0.114 * pixels[o + 2]
	}

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = y * width + x
			const value = gray[i] < THRESHOLD ? 0 : 255
			const error = gray[i] - value
			const o = i * 4
			pixels[o] = value
			pixels[o + 1] = value
			pixels[o + 2] = value
			pixels[o + 3] = 255

			// 7/16 goes right; 3/16, 5/16 and 1/16 go to the row below
			if (x + 1 < width) gray[i + 1] += (error * 7) / 16
			if (y + 1 < height) {
				if (x > 0) gray[i + width - 1] += (error * 3) / 16
				gray[i + width] += (error * 5) / 16
				if (x + 1 < width) gray[i + width + 1] += error / 16
			}
		}
	}
}

/** the whole picture in black and white, as Paint's Properties dialog makes it. */
export function monochromeImage(source: HTMLCanvasElement): HTMLCanvasElement {
	const canvas = canvasOf(source.width, source.height)
	const ctx = canvas.getContext("2d")
	if (!ctx) return canvas

	ctx.drawImage(source, 0, 0)
	const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
	ditherToMono(image.data, image.width, image.height)
	ctx.putImageData(image, 0, 0)
	return canvas
}
