import type { Point, Rect } from "store/types"
import type { FillRequest, FillResponse, RGBA } from "./types"

/** the worker outlives one fill: spinning a module worker up costs ~10 ms. */
let worker: Worker | null = null

function ensureWorker(): Worker {
	if (!worker) {
		worker = new Worker(new URL("./fill.worker.ts", import.meta.url), {
			type: "module",
		})
	}
	return worker
}

/**
 * runs the fill off the main thread and hands back the filled pixels. one
 * request at a time, which is all the engine allows: it blocks new gestures
 * while a fill is in flight.
 */
export function floodFillOffThread(
	image: ImageData,
	seed: Point,
	color: RGBA,
): Promise<{ image: ImageData; dirty: Rect | null }> {
	const { width, height } = image
	const instance = ensureWorker()

	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<FillResponse>) => {
			cleanup()
			resolve({
				image: new ImageData(new Uint8ClampedArray(data.buffer), width, height),
				dirty: data.dirty,
			})
		}
		const onError = (e: ErrorEvent) => {
			cleanup()
			// the worker is suspect once it has thrown; the next fill builds a new one
			worker = null
			instance.terminate()
			reject(e.error ?? new Error("fill worker failed"))
		}
		const cleanup = () => {
			instance.removeEventListener("message", onMessage)
			instance.removeEventListener("error", onError)
		}

		instance.addEventListener("message", onMessage)
		instance.addEventListener("error", onError)

		const request: FillRequest = {
			buffer: image.data.buffer,
			width,
			height,
			seed,
			color,
		}
		instance.postMessage(request, [request.buffer])
	})
}
