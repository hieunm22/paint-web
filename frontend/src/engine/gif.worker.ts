import { applyPalette, GIFEncoder, quantize } from "gifenc"
import type { GifRequest, GifResponse } from "types/engine.types"

/**
 * GIF encoding off the main thread: quantising a megapixel down to 256 colours
 * stalls a frame badly. self is typed as a Worker because the DOM and webworker
 * libs cannot both be loaded.
 */
const worker = self as unknown as Worker

const COLORS = 256
const FORMAT = "rgba4444"

worker.onmessage = ({ data }: MessageEvent<GifRequest>) => {
	const { buffer, width, height } = data
	const rgba = new Uint8ClampedArray(buffer)

	// oneBitAlpha pushes every pixel to fully clear or fully opaque, which is
	// all the format carries
	const palette = quantize(rgba, COLORS, { format: FORMAT, oneBitAlpha: true })
	const index = applyPalette(rgba, palette, FORMAT)
	const clear = palette.findIndex((color) => color[3] === 0)

	const gif = GIFEncoder()
	gif.writeFrame(index, width, height, {
		palette,
		transparent: clear >= 0,
		transparentIndex: Math.max(clear, 0),
	})
	gif.finish()

	const bytes = gif.bytes()
	const response: GifResponse = { buffer: bytes.buffer }
	worker.postMessage(response, [response.buffer])
}
