import { CAN_ENCODE_OFF_THREAD, MIME_TYPES } from "common/constant"
import { encodeOffThread } from "engine/encodeWorker"
import { encodeGifOffThread } from "engine/gifWorker"
import { decodeHeifOffThread } from "engine/heifWorker"
import { iconSize, wrapIco } from "engine/ico"
import type { ImageFormat } from "types/store.types"

const PAPER = 255

/** neither format carries alpha: a clear pixel would otherwise come out black. */
const FLATTENED: ImageFormat[] = ["jpeg", "bmp"]

/** marks an animated gif; every encoder that loops writes this block. */
const LOOP_MARKER = "NETSCAPE2.0"

/** the brand an heif file names at bytes 8 to 12, behind its ftyp box. */
const HEIF_BRANDS = [
	"heic",
	"heix",
	"heim",
	"heis",
	"hevc",
	"hevx",
	"hevm",
	"hevs",
	"mif1",
	"msf1",
]

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
 * an ico holds one png of at most 256 pixels a side: a larger picture is
 * scaled down to fit. small enough that the main thread can afford it.
 */
async function encodeIco(image: ImageData): Promise<Blob> {
	const target = iconSize(image)
	const fitted = document.createElement("canvas")
	fitted.width = target.width
	fitted.height = target.height
	fitted
		.getContext("2d")
		?.drawImage(canvasOf(image), 0, 0, target.width, target.height)

	const png = await canvasToBlob(fitted, MIME_TYPES.png)
	const bytes = new Uint8Array(await png.arrayBuffer())
	return wrapIco(bytes, target)
}

/**
 * one document to one file. quality applies to jpeg and webp only; the
 * others ignore it. the input is left untouched whatever the format does.
 */
export function encodeImage(
	image: ImageData,
	format: ImageFormat,
	quality?: number,
): Promise<Blob> {
	// every worker takes the buffer with it, which the copy makes safe
	const flattens = FLATTENED.includes(format)
	const source = flattens ? flatten(copyOf(image)) : copyOf(image)
	const type = MIME_TYPES[format]

	if (format === "gif") return encodeGifOffThread(source)
	if (format === "ico") return encodeIco(source)
	// the hand-written bmp writer needs no canvas and always goes off thread
	const isBmp = format === "bmp"
	const offThread = isBmp || CAN_ENCODE_OFF_THREAD
	if (offThread) return encodeOffThread(source, type, isBmp, quality)

	return canvasToBlob(canvasOf(source), type, quality)
}

/** the whole picture behind an url, which the print sheet points its img at. */
export async function imageObjectUrl(image: ImageData): Promise<string> {
	const png = await encodeImage(image, "png")
	return URL.createObjectURL(png)
}

/** read from the bytes: a phone photo often arrives with no type at all. */
async function isHeif(file: Blob): Promise<boolean> {
	const head = new Uint8Array(await file.slice(4, 12).arrayBuffer())
	const text = new TextDecoder("latin1").decode(head)
	return text.startsWith("ftyp") && HEIF_BRANDS.includes(text.slice(4))
}

/**
 * decodes off the main thread. an animated gif yields its first frame only,
 * and heif goes to a decoder of its own wherever the browser lacks one.
 */
export async function decodeImage(source: Blob): Promise<ImageBitmap> {
	try {
		return await createImageBitmap(source)
	} catch (error) {
		if (!(await isHeif(source))) throw error
		const imageData = await decodeHeifOffThread(source)
		return createImageBitmap(imageData)
	}
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
