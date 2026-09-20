import { PAPER_COLOR } from "common/constant"
import { readPixel } from "engine/raster"
import { needsVirtual, viewWindow, wholeDocument } from "engine/virtual"
import type {
	RGBA,
	Size,
	SurfaceContexts,
	SurfaceLayers,
	SurfaceStore,
} from "types/engine.types"
import type { Rect } from "types/store.types"

const EMPTY: Size = { width: 0, height: 0 }
const NOWHERE: Rect = { x: 0, y: 0, w: 0, h: 0 }

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

function detachedCanvas(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas")
	canvas.width = width
	canvas.height = height
	return canvas
}

/** one window blit, squares kept square whichever way the zoom goes. */
function blit(
	target: CanvasRenderingContext2D,
	source: HTMLCanvasElement,
	box: Rect,
	width: number,
	height: number,
): void {
	target.clearRect(0, 0, width, height)
	if (box.w <= 0 || box.h <= 0) return

	target.imageSmoothingEnabled = false
	target.drawImage(source, box.x, box.y, box.w, box.h, 0, 0, width, height)
}

/**
 * drives the three stacked canvases of one document. base keeps the committed
 * bitmap, preview the stroke in progress, overlay the screen-space chrome.
 *
 * a document too large for the dom, or one zoomed far in, keeps its two
 * picture layers detached and shows the visible part through a window.
 */
export class Surface {
	private layers: SurfaceLayers | null = null
	private ctx: SurfaceContexts | null = null
	/** where the picture really lives, which is the dom canvas when direct. */
	private store: SurfaceStore | null = null
	private docSize: Size = EMPTY
	private overlayCss: Size = EMPTY
	private scratch: CanvasRenderingContext2D | null = null
	/** the cursor last written, which keeps a pointer move off the dom. */
	private cursor = ""
	private virtual = false
	private zoom = 1
	/** what the viewport shows in image pixels, null until it reports. */
	private view: Rect | null = null
	private window: Rect = NOWHERE
	/** set by the drawing getters: nothing reaches the picture without one. */
	private stale = false
	private repaint: number | null = null

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
		this.store = null
		this.virtual = false
		this.docSize = EMPTY
		this.overlayCss = EMPTY
		this.window = NOWHERE
		this.cursor = ""
	}

	detach(): void {
		this.cancelRepaint()
		this.layers = null
		this.ctx = null
		this.store = null
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

	/**
	 * the part of the picture the drawing canvases hold. a pointer position is
	 * measured from their corner, which is not the paper's while windowed.
	 */
	get viewBox(): Rect {
		return this.window
	}

	get baseContext(): CanvasRenderingContext2D | null {
		this.stale = true
		this.scheduleRepaint()
		return this.store?.baseCtx ?? null
	}

	get previewContext(): CanvasRenderingContext2D | null {
		this.stale = true
		this.scheduleRepaint()
		return this.store?.previewCtx ?? null
	}

	get overlayContext(): CanvasRenderingContext2D | null {
		return this.ctx?.overlay ?? null
	}

	/**
	 * what the viewport shows, in image pixels, and the zoom it shows it at.
	 * both decide how much of the picture the dom is asked to hold.
	 */
	setView(view: Rect, zoom: number): void {
		this.view = view
		this.zoom = zoom
		this.applyMode()
		this.present()
	}

	/** paints the window now if anything has touched the picture since the last. */
	flush(): void {
		if (this.stale) this.present()
	}

	/**
	 * sizes the picture layers in image pixels, never scaled by devicePixelRatio.
	 * old pixels stay anchored top-left and the new area comes out white, like Paint.
	 */
	resizeDocument({ width, height }: Size): void {
		if (!this.layers) return
		if (width === this.docSize.width && height === this.docSize.height) return

		const kept = this.store ? copyOf(this.store.base) : null

		this.docSize = { width, height }
		this.applyMode()

		const ctx = this.store?.baseCtx
		if (!ctx) return

		// assigning width wipes the bitmap; paper and old pixels go back on after
		ctx.fillStyle = PAPER_COLOR
		ctx.fillRect(0, 0, width, height)
		if (kept) ctx.drawImage(kept, 0, 0)
		this.present()
	}

	/**
	 * swaps the whole bitmap for another picture, the document taking its size.
	 * a crop or a rotate replaces what is there rather than growing the paper.
	 */
	replaceDocument(source: HTMLCanvasElement): void {
		this.resizeLayers(source.width, source.height)
		this.store?.baseCtx.drawImage(source, 0, 0)
		this.present()
	}

	/** puts a whole saved bitmap back, which is how a size change undoes. */
	restoreDocument(data: ImageData): void {
		this.resizeLayers(data.width, data.height)
		this.store?.baseCtx.putImageData(data, 0, 0)
		this.present()
	}

	/** detached copy of the committed bitmap, which a transform reads from. */
	snapshot(): HTMLCanvasElement | null {
		return this.store ? copyOf(this.store.base) : null
	}

	/**
	 * draws the whole picture into a box of another canvas, the stroke in
	 * progress included: a thumbnail has to follow the hand that is drawing.
	 */
	drawInto(target: CanvasRenderingContext2D, box: Rect): void {
		const { store } = this
		if (!store || !this.docSize.width || !this.docSize.height) return

		target.drawImage(store.base, box.x, box.y, box.w, box.h)
		target.drawImage(store.preview, box.x, box.y, box.w, box.h)
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
		return this.store?.baseCtx.getImageData(x, y, w, h) ?? null
	}

	/** writes pixels back at an image-space position, replacing what was there. */
	writeRegion(data: ImageData, x: number, y: number): void {
		this.store?.baseCtx.putImageData(data, x, y)
		this.present()
	}

	/**
	 * one committed pixel, read through a 1x1 scratch canvas. willReadFrequently
	 * belongs on that canvas and never on base, which it would pin to the CPU.
	 */
	readPixel(x: number, y: number): RGBA | null {
		const { store } = this
		if (!store) return null

		if (!this.scratch) {
			const canvas = detachedCanvas(1, 1)
			this.scratch = canvas.getContext("2d", { willReadFrequently: true })
		}
		if (!this.scratch) return null

		this.scratch.clearRect(0, 0, 1, 1)
		this.scratch.drawImage(store.base, -x, -y)
		return readPixel(this.scratch.getImageData(0, 0, 1, 1), 0, 0)
	}

	/**
	 * css cursor over the drawing surface, above the one the tool sets. an
	 * empty string hands it back, be that a drawn glyph or a crosshair.
	 */
	setCursor(value: string): void {
		if (value === this.cursor) return

		this.cursor = value
		if (this.layers) this.layers.preview.style.cursor = value
	}

	clearPreview(): void {
		const { width, height } = this.docSize
		this.store?.previewCtx.clearRect(0, 0, width, height)
		this.present()
	}

	clearOverlay(): void {
		const { width, height } = this.overlayCss
		this.ctx?.overlay.clearRect(0, 0, width, height)
	}

	/** bakes preview into base, which is how a stroke becomes permanent. */
	commitPreview(): void {
		const { store } = this
		if (!store) return

		store.baseCtx.drawImage(store.preview, 0, 0)
		this.clearPreview()
	}

	/** repaints the whole document white, dropping every committed pixel. */
	clearDocument(): void {
		const { store } = this
		const { width, height } = this.docSize
		if (!store) return

		store.baseCtx.fillStyle = PAPER_COLOR
		store.baseCtx.fillRect(0, 0, width, height)
		this.clearPreview()
	}

	/**
	 * resizes the picture layers and lays fresh paper down. every pixel goes,
	 * which is what leaves the caller a clean sheet to draw onto.
	 */
	private resizeLayers(width: number, height: number): void {
		if (!this.layers) return

		this.docSize = { width, height }
		this.applyMode()

		const ctx = this.store?.baseCtx
		if (!ctx) return

		ctx.fillStyle = PAPER_COLOR
		ctx.fillRect(0, 0, width, height)
	}

	/**
	 * picks between drawing into the dom and drawing through a window, and
	 * lays the picture layers out for whichever it landed on.
	 */
	private applyMode(): void {
		const { layers } = this
		if (!layers) return

		const wanted = needsVirtual(this.docSize, this.zoom)
		const sized =
			this.store !== null &&
			this.store.base.width === this.docSize.width &&
			this.store.base.height === this.docSize.height

		if (wanted !== this.virtual || !sized) this.buildStore(wanted)

		this.window = this.virtual
			? viewWindow(this.docSize, this.view, this.zoom)
			: wholeDocument(this.docSize)
		this.placeWindow()
	}

	/**
	 * moves the picture onto the layers the chosen mode draws into. the old
	 * pixels ride across on a copy: a zoom step must not wipe the canvas.
	 */
	private buildStore(virtual: boolean): void {
		const { layers } = this
		if (!layers) return

		const { width, height } = this.docSize
		const oldBase = this.store ? copyOf(this.store.base) : null
		const oldPreview = this.store ? copyOf(this.store.preview) : null

		if (virtual) {
			const base = detachedCanvas(width, height)
			const preview = detachedCanvas(width, height)
			this.store = {
				base,
				preview,
				baseCtx: context2d(base),
				previewCtx: context2d(preview),
			}
		} else {
			layers.base.width = width
			layers.base.height = height
			layers.preview.width = width
			layers.preview.height = height
			this.store = {
				base: layers.base,
				preview: layers.preview,
				baseCtx: context2d(layers.base),
				previewCtx: context2d(layers.preview),
			}
		}

		this.virtual = virtual
		if (oldBase) this.store.baseCtx.drawImage(oldBase, 0, 0)
		if (oldPreview) this.store.previewCtx.drawImage(oldPreview, 0, 0)
	}

	/** the css box of the two picture layers, which the frame is measured in. */
	private placeWindow(): void {
		const { layers } = this
		if (!layers) return

		const box = this.window
		const left = `${box.x * this.zoom}px`
		const top = `${box.y * this.zoom}px`
		const width = `${box.w * this.zoom}px`
		const height = `${box.h * this.zoom}px`

		for (const layer of [layers.base, layers.preview]) {
			layer.style.left = left
			layer.style.top = top
			layer.style.width = width
			layer.style.height = height
		}
	}

	/**
	 * copies the visible part onto the dom canvases. direct mode draws straight
	 * into them and has nothing to copy.
	 */
	private present(): void {
		this.cancelRepaint()
		this.stale = false

		const { layers, ctx, store } = this
		if (!layers || !ctx || !store || !this.virtual) return

		const box = this.window
		const width = Math.max(1, Math.round(box.w * this.zoom))
		const height = Math.max(1, Math.round(box.h * this.zoom))

		// assigning a size wipes the bitmap, a cost only a real change pays
		if (layers.base.width !== width || layers.base.height !== height) {
			layers.base.width = width
			layers.base.height = height
			layers.preview.width = width
			layers.preview.height = height
		}

		blit(ctx.base, store.base, box, width, height)
		blit(ctx.preview, store.preview, box, width, height)
	}

	/**
	 * the catch-all for pixels written outside a gesture, such as an undo or a
	 * store-driven repaint. a stroke calls flush and does not wait for it.
	 */
	private scheduleRepaint(): void {
		if (!this.virtual || this.repaint !== null) return

		this.repaint = requestAnimationFrame(() => {
			this.repaint = null
			if (this.stale) this.present()
		})
	}

	private cancelRepaint(): void {
		if (this.repaint === null) return

		cancelAnimationFrame(this.repaint)
		this.repaint = null
	}
}
