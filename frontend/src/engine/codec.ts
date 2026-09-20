import { MIME_TYPES } from "common/constant"
import { encodeBmp24 } from "engine/bmp"
import { encodeGifOffThread } from "engine/gifWorker"
import type { ImageFormat } from "types/store.types"

const PAPER = 255

/** neither format carries alpha: a clear pixel would otherwise come out black. */
const FLATTENED: ImageFormat[] = ["jpeg", "bmp"]

/** marks an animated gif; every encoder that loops writes this block. */
const LOOP_MARKER = "NETSCAPE2.0"

function copyOf(image: ImageData): ImageData {
	return new ImageData(
		new Uint8ClampedArray(image.data),
		image.width,
		image.height,
	)
}

/** composites onto paper in place, the way a format without alpha needs. */
function flatten(image: ImageData): ImageData {
	const { data } = image

	for (let i = 0; i < data.length; i += 4) {
		const a = data[i + 3]
		if (a === 255) continue

		const clear = PAPER * (255 - a)
		data[i] = (data[i] * a + clear) / 255
		data[i + 1] = (data[i + 1] * a + clear) / 255
		data[i + 2] = (data[i + 2] * a + clear) / 255
		data[i + 3] = 255
	}
	return image
}

function canvasOf(image: ImageData): HTMLCanvasElement {
	const canvas = document.createElement("canvas")
	canvas.width = image.width
	canvas.height = image.height
	canvas.getContext("2d")?.putImageData(image, 0, 0)
	return canvas
}

function canvasToBlob(
	canvas: HTMLCanvasElement,
	type: string,
	quality?: number,
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			blob =>
				blob ? resolve(blob) : reject(new Error(`cannot encode ${type}`)),
			type,
			quality,
		)
	})
}

/**
 * one document to one file. quality applies to jpeg and webp only; the other
 * three ignore it. the input is left untouched whatever the format does.
 */
export function encodeImage(
	image: ImageData,
	format: ImageFormat,
	quality?: number,
): Promise<Blob> {
	const source = FLATTENED.includes(format) ? flatten(copyOf(image)) : image

	if (format === "bmp") return Promise.resolve(encodeBmp24(source))
	// the worker takes the buffer with it, which a copy makes safe
	if (format === "gif") return encodeGifOffThread(copyOf(source))

	return canvasToBlob(canvasOf(source), MIME_TYPES[format], quality)
}

/** decodes off the main thread. an animated gif yields its first frame only. */
export function decodeImage(source: Blob): Promise<ImageBitmap> {
	return createImageBitmap(source)
}

/**
 * whether a gif holds more than one frame, which opening it would throw away.
 * the loop block is what every animation writer emits.
 */
export async function isAnimatedGif(file: Blob): Promise<boolean> {
	if (file.type !== MIME_TYPES.gif) return false

	const bytes = new Uint8Array(await file.arrayBuffer())
	const text = new TextDecoder("latin1").decode(bytes)
	return text.includes(LOOP_MARKER)
}

/** small png of the whole picture, letterboxed into a square for the recents list. */
export function thumbnailDataUrl(
	source: ImageData | ImageBitmap,
	size: number,
): string {
	const scale = Math.min(size / source.width, size / source.height, 1)
	const box = document.createElement("canvas")
	box.width = size
	box.height = size

	const ctx = box.getContext("2d")
	if (!ctx) return ""

	const w = Math.max(1, Math.round(source.width * scale))
	const h = Math.max(1, Math.round(source.height * scale))
	const drawable = source instanceof ImageData ? canvasOf(source) : source
	ctx.drawImage(drawable, (size - w) / 2, (size - h) / 2, w, h)
	return box.toDataURL(MIME_TYPES.png)
}
