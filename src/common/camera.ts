import { CAMERA_IDEAL, MIME_TYPES } from "common/constant"

/** what a browser calls a refusal, as opposed to having no camera at all. */
const REFUSALS = ["NotAllowedError", "SecurityError"]

/** true while the page may ask for a camera; http never gets one. */
export function canUseCamera(): boolean {
	return Boolean(window.isSecureContext && navigator.mediaDevices?.getUserMedia)
}

/** the camera, asked for the largest frame it has and given whatever it holds. */
export function openCamera(): Promise<MediaStream> {
	return navigator.mediaDevices.getUserMedia({
		video: {
			width: { ideal: CAMERA_IDEAL.width },
			height: { ideal: CAMERA_IDEAL.height },
		},
	})
}

/** the light beside the lens stays on until every track is stopped. */
export function stopCamera(stream: MediaStream | null): void {
	for (const track of stream?.getTracks() ?? []) track.stop()
}

/** true when the camera refused rather than being missing. */
export function wasRefused(error: unknown): boolean {
	return error instanceof DOMException && REFUSALS.includes(error.name)
}

/** one frame at the camera's own size, which is what the document becomes. */
export function captureFrame(video: HTMLVideoElement): Promise<Blob> {
	const canvas = document.createElement("canvas")
	canvas.width = video.videoWidth
	canvas.height = video.videoHeight

	const ctx = canvas.getContext("2d")
	if (!ctx || !canvas.width || !canvas.height) {
		return Promise.reject(new Error("the camera has no frame yet"))
	}

	ctx.drawImage(video, 0, 0)
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			blob => (blob ? resolve(blob) : reject(new Error("frame not encoded"))),
			MIME_TYPES.png,
		)
	})
}
