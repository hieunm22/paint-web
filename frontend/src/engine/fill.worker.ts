import { floodFill } from "engine/raster"
import type { FillRequest, FillResponse } from "types/engine.types"

/**
 * flood fill for pictures too large to do between two frames. the client is
 * fillWorker.ts; the pixel buffer is transferred both ways, never copied.
 * self is typed as a Worker: the DOM and webworker libs cannot both be loaded.
 */
const worker = self as unknown as Worker

worker.onmessage = ({ data }: MessageEvent<FillRequest>) => {
	const {
		buffer,
		width,
		height,
		seed,
		color,
	} = data
	const image = {
		data: new Uint8ClampedArray(buffer),
		width,
		height,
	} as ImageData

	const dirty = floodFill(image, seed, color)
	const response: FillResponse = { buffer: image.data.buffer, dirty }
	worker.postMessage(response, [response.buffer])
}
