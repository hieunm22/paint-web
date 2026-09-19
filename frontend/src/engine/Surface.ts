import type { Rect } from "store/types"
import type {
	RGBA,
	Size,
	SurfaceContexts,
	SurfaceLayers,
} from "./types"
import { readPixel } from "./raster"

const PAPER = "#ffffff"
const EMPTY: Size = { width: 0, height: 0 }

/**
 * no willReadFrequently here: it pins the surface to the CPU and costs well over
 * a hundred megabytes on a large document. pixel reads get a small scratch canvas.
 */
function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error("2d canvas context is unavailable")
	return ctx
}

/** detached copy of a canvas, used to carry pixels across a resize. */
function copyOf(source: HTMLCanvasElement): HTMLCanvasElement | null {
	if (source.width === 0 || source.height === 0) return null

	const copy = document.createElement("canvas")
	copy.width = source.width
	copy.height = source.height
	copy.getContext("2d")?.drawImage(source, 0, 0)
	return copy
}

/**
 * drives the three stacked canvases of one document. base keeps the committed
 * bitmap, preview the stroke in progress, overlay the screen-space chrome.
 */
export class Surface {
	private layers: SurfaceLayers | null = null
	private ctx: SurfaceContexts | null = null
	private docSize: Size = EMPTY
	private overlayCss: Size = EMPTY
	private scratch: CanvasRenderingContext2D | null = null

	/**
	 * the recorded sizes are dropped, forcing the next resize to re-sync. that is
	 * what makes a re-attach safe when react has replaced the canvas elements.
	 */
	attach(layers: SurfaceLayers): void {
		this.layers = layers
		this.ctx = {
			base: context2d(layers.base),
			preview: context2d(layers.preview),
			overlay: context2d(layers.overlay),
		}
		this.docSize = EMPTY
		this.overlayCss = EMPTY
	}

	detach(): void {
		this.layers = null
		this.ctx = null
	}

	get isAttached(): boolean {
		return this.ctx !== null
	}

	/** document size in image pixels. */
	get documentSize(): Size {
		return this.docSize
	}

	/** overlay size in css pixels, which is what callers draw in. */
	get overlaySize(): Size {
		return this.overlayCss
	}

	get baseContext(): CanvasRenderingContext2D | null {
		return this.ctx?.base ?? null
	}

	get previewContext(): CanvasRenderingContext2D | null {
		return this.ctx?.preview ?? null
	}

	get overlayContext(): CanvasRenderingContext2D | null {
		return this.ctx?.overlay ?? null
	}

	/**
	 * sizes base and preview in image pixels, never scaled by devicePixelRatio.
	 * old pixels stay anchored top-left and the new area comes out white, like Paint.
	 */
	resizeDocument({ width, height }: Size): void {
		const { layers, ctx } = this
		if (!layers || !ctx) return
		if (width === this.docSize.width && height === this.docSize.height) return

		const kept = copyOf(layers.base)

		layers.base.width = width
		layers.base.height = height
		layers.preview.width = width
		layers.preview.height = height
		this.docSize = { width, height }

		// assigning width wipes the bitmap; paper and old pixels go back on after
		ctx.base.fillStyle = PAPER
		ctx.base.fillRect(0, 0, width, height)
		if (kept) ctx.base.drawImage(kept, 0, 0)
	}

	/**
	 * overlay lives in screen space: its bitmap is device pixels while the
	 * transform lets callers keep drawing in css pixels.
	 */
	resizeOverlay({ width, height }: Size): void {
		const { layers, ctx } = this
		if (!layers || !ctx) return

		const dpr = window.devicePixelRatio || 1
		layers.overlay.width = Math.round(width * dpr)
		layers.overlay.height = Math.round(height * dpr)
		ctx.overlay.setTransform(dpr, 0, 0, dpr, 0, 0)
		this.overlayCss = { width, height }
	}

	/** committed pixels of a box, clipped by the caller to the document. */
	readRegion({
		x,
		y,
		w,
		h,
	}: Rect): ImageData | null {
		return this.ctx?.base.getImageData(x, y, w, h) ?? null
	}

	/** writes pixels back at an image-space position, replacing what was there. */
	writeRegion(data: ImageData, x: number, y: number): void {
		this.ctx?.base.putImageData(data, x, y)
	}

	/**
	 * one committed pixel, read through a 1x1 scratch canvas. willReadFrequently
	 * belongs on that canvas and never on base, which it would pin to the CPU.
	 */
	readPixel(x: number, y: number): RGBA | null {
		const { layers } = this
		if (!layers) return null

		if (!this.scratch) {
			const canvas = document.createElement("canvas")
			canvas.width = 1
			canvas.height = 1
			this.scratch = canvas.getContext("2d", { willReadFrequently: true })
		}
		if (!this.scratch) return null

		this.scratch.clearRect(0, 0, 1, 1)
		this.scratch.drawImage(layers.base, -x, -y)
		return readPixel(this.scratch.getImageData(0, 0, 1, 1), 0, 0)
	}

	clearPreview(): void {
		const { width, height } = this.docSize
		this.ctx?.preview.clearRect(0, 0, width, height)
	}

	clearOverlay(): void {
		const { width, height } = this.overlayCss
		this.ctx?.overlay.clearRect(0, 0, width, height)
	}

	/** bakes preview into base, which is how a stroke becomes permanent. */
	commitPreview(): void {
		const { layers, ctx } = this
		if (!layers || !ctx) return

		ctx.base.drawImage(layers.preview, 0, 0)
		this.clearPreview()
	}

	/** repaints the whole document white, dropping every committed pixel. */
	clearDocument(): void {
		const { width, height } = this.docSize
		if (!this.ctx) return

		this.ctx.base.fillStyle = PAPER
		this.ctx.base.fillRect(0, 0, width, height)
		this.clearPreview()
	}
}
