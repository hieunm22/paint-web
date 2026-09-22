import type { EncodeRequest, EncodeResponse } from "types/engine.types"

/** one worker serves every save: starting a module worker costs about 10 ms. */
let worker: Worker | null = null

function ensureWorker(): Worker {
	if (!worker) {
		worker = new Worker(new URL("./encode.worker.ts", import.meta.url), {
			type: "module",
		})
	}
	return worker
}

/**
 * writes one file off the main thread. the pixel buffer is transferred rather
 * than copied, and the caller loses its view of it whatever the outcome.
 */
export function encodeOffThread(
	image: ImageData,
	type: string,
	bmp: boolean,
	quality?: number,
): Promise<Blob> {
	const { width, height } = image
	const instance = ensureWorker()

	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<EncodeResponse>) => {
			cleanup()
			if (data.blob) resolve(data.blob)
			else reject(new Error(data.error ?? `cannot encode ${type}`))
		}
		const onError = (e: ErrorEvent) => {
			cleanup()
			// the worker is suspect once it has thrown; the next save builds a new one
			worker = null
			instance.terminate()
			reject(e.error ?? new Error("encode worker failed"))
		}
		const cleanup = () => {
			instance.removeEventListener("message", onMessage)
			instance.removeEventListener("error", onError)
		}

		instance.addEventListener("message", onMessage)
		instance.addEventListener("error", onError)

		const request: EncodeRequest = {
			buffer: image.data.buffer,
			width,
			height,
			type,
			bmp,
			quality,
		}
		instance.postMessage(request, [request.buffer])
	})
}
