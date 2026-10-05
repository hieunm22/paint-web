import libheif, { type HeifImage, type HeifPixels } from "libheif-js"
import type { HeifRequest, HeifResponse } from "types/engine.types"

/**
 * heif decoding off the main thread: a phone photo holds the interface for
 * seconds. self is cast: the dom lib is the one loaded.
 */
const worker = self as unknown as Worker

function pixelsOf(image: HeifImage): Promise<HeifPixels> {
	const width = image.get_width()
	const height = image.get_height()
	const target = {
		data: new Uint8ClampedArray(width * height * 4),
		width,
		height,
	}

	return new Promise((resolve, reject) => {
		image.display(target, result =>
			result ? resolve(result) : reject(new Error("cannot decode heif")),
		)
	})
}

worker.onmessage = async ({ data }: MessageEvent<HeifRequest>) => {
	let images: HeifImage[] = []

	try {
		images = new libheif.HeifDecoder().decode(new Uint8Array(data.buffer))
		// a burst or a live photo carries more than one; the primary is the photo
		const primary = images.find(one => one.is_primary()) ?? images[0]
		if (!primary) throw new Error("no picture in the heif file")

		const { data: pixels, width, height } = await pixelsOf(primary)
		const done: HeifResponse = {
			buffer: pixels.buffer,
			width,
			height,
			error: null,
		}
		worker.postMessage(done, [pixels.buffer])
	} catch (cause) {
		// a rejected promise never reaches the worker's error event; the caller
		// is told in a message instead of waiting forever
		const reason = cause instanceof Error ? cause.message : "cannot decode heif"
		const failed: HeifResponse = {
			buffer: null,
			width: 0,
			height: 0,
			error: reason,
		}
		worker.postMessage(failed)
	} finally {
		images.forEach(one => one.free())
	}
}
