import { encodeBmp24 } from "engine/bmp"
import type { EncodeRequest, EncodeResponse } from "types/engine.types"

/**
 * writes the file off the main thread: at 8000 pixels square an encode holds
 * the interface for seconds. self is cast, the dom lib is the one loaded.
 */
const worker = self as unknown as Worker

/** the only encoder a worker has for png, jpeg and webp. */
async function encodeRaster(
	image: ImageData,
	type: string,
	quality?: number,
): Promise<Blob> {
	const canvas = new OffscreenCanvas(image.width, image.height)
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error(`cannot encode ${type}`)

	ctx.putImageData(image, 0, 0)
	return canvas.convertToBlob({ type, quality })
}

worker.onmessage = async ({ data }: MessageEvent<EncodeRequest>) => {
	const {
		buffer,
		width,
		height,
		type,
		bmp,
		quality,
	} = data

	try {
		const pixels = new Uint8ClampedArray(buffer)
		const image = new ImageData(pixels, width, height)
		const blob = bmp
			? encodeBmp24(image)
			: await encodeRaster(image, type, quality)
		const done: EncodeResponse = { blob, error: null }
		worker.postMessage(done)
	} catch (cause) {
		// a rejected promise never reaches the worker's error event; the caller
		// is told in a message instead of waiting forever
		const reason =
			cause instanceof Error ? cause.message : `cannot encode ${type}`
		const failed: EncodeResponse = { blob: null, error: reason }
		worker.postMessage(failed)
	}
}
