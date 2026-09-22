import type { GifRequest, GifResponse } from "types/engine.types"

/** one worker serves every save: starting a module worker costs about 10 ms. */
let worker: Worker | null = null

function ensureWorker(): Worker {
	if (!worker) {
		worker = new Worker(new URL("./gif.worker.ts", import.meta.url), {
			type: "module",
		})
	}
	return worker
}

/**
 * quantises and encodes one frame off the main thread. the pixel buffer is
 * transferred both ways rather than copied, and the caller loses its view.
 */
export function encodeGifOffThread(image: ImageData): Promise<Blob> {
	const { width, height } = image
	const instance = ensureWorker()

	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<GifResponse>) => {
			cleanup()
			resolve(new Blob([data.buffer], { type: "image/gif" }))
		}
		const onError = (e: ErrorEvent) => {
			cleanup()
			// a worker that has thrown is suspect; the next save builds a new one
			worker = null
			instance.terminate()
			reject(e.error ?? new Error("gif worker failed"))
		}
		const cleanup = () => {
			instance.removeEventListener("message", onMessage)
			instance.removeEventListener("error", onError)
		}

		instance.addEventListener("message", onMessage)
		instance.addEventListener("error", onError)

		const request: GifRequest = { buffer: image.data.buffer, width, height }
		instance.postMessage(request, [request.buffer])
	})
}
