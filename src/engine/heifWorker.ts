import type { HeifRequest, HeifResponse } from "types/engine.types"

/**
 * decodes one heif file off the main thread. each file gets a worker of its
 * own: the decoder heap grows to the picture and never shrinks back.
 */
export async function decodeHeifOffThread(file: Blob): Promise<ImageData> {
	const buffer = await file.arrayBuffer()
	const worker = new Worker(new URL("./heif.worker.ts", import.meta.url), {
		type: "module",
	})

	return new Promise((resolve, reject) => {
		const onMessage = ({ data }: MessageEvent<HeifResponse>) => {
			worker.terminate()
			if (!data.buffer) {
				reject(new Error(data.error ?? "cannot decode heif"))
				return
			}
			const pixels = new Uint8ClampedArray(data.buffer)
			resolve(new ImageData(pixels, data.width, data.height))
		}
		const onError = (e: ErrorEvent) => {
			worker.terminate()
			reject(e.error ?? new Error("heif worker failed"))
		}

		worker.addEventListener("message", onMessage)
		worker.addEventListener("error", onError)

		const request: HeifRequest = { buffer }
		worker.postMessage(request, [buffer])
	})
}
