import { floodFill } from "engine/raster"
import type { FillRequest, FillResponse } from "types/engine.types"

/**
 * flood fill for pictures too large to do between two frames, the buffer
 * transferred both ways. self is cast: the dom lib is the one loaded.
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
