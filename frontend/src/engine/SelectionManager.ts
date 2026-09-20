import { hexToRgba } from "engine/color"
import { clampRect, insideRect, rectUnion } from "engine/geometry"
import type { SelectionMask, ToolContext } from "types/engine.types"
import type { Point, Rect, SelectionKind } from "types/store.types"

function canvasOf(width: number, height: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas")
	canvas.width = Math.max(1, Math.round(width))
	canvas.height = Math.max(1, Math.round(height))
	return canvas
}

let prober: CanvasRenderingContext2D | null | undefined

/** one scratch context, the only way to ask a Path2D whether it holds a point. */
function probe(): CanvasRenderingContext2D | null {
	if (prober === undefined) {
		prober =
			typeof document === "undefined" ? null : canvasOf(1, 1).getContext("2d")
	}

	return prober
}

/**
 * the one floating selection: which pixels are picked, where they sit now and
 * whether they have left the base bitmap yet. both select tools share it.
 */
export class SelectionManager {
	private shape: SelectionKind = "none"
	/** where the pixels were taken from, which the hole fill and undo need. */
	private source: Rect | null = null
	private box: Rect | null = null
	private mask: SelectionMask | null = null
	/** the traced corners, kept in step with the box so the ants follow them. */
	private outline: Point[] | null = null
	/** the pixels as they were picked up, before transparency is applied. */
	private raw: HTMLCanvasElement | null = null
	private buffer: HTMLCanvasElement | null = null

	get kind(): SelectionKind {
		return this.shape
	}

	get bounds(): Rect | null {
		return this.box
	}

	get lasso(): Point[] | null {
		return this.outline
	}

	/** true once the pixels have been picked up off the base bitmap. */
	get isFloating(): boolean {
		return this.raw !== null
	}

	get isActive(): boolean {
		return this.shape !== "none"
	}

	/** marks out a region whose pixels are still part of the picture. */
	define(
		kind: SelectionKind,
		bounds: Rect,
		mask: SelectionMask | null,
		outline: Point[] | null = null,
	): void {
		this.shape = kind
		this.box = bounds
		this.source = bounds
		this.mask = mask
		this.outline = outline
		this.raw = null
		this.buffer = null
	}

	clear(): void {
		this.shape = "none"
		this.box = null
		this.source = null
		this.mask = null
		this.outline = null
		this.raw = null
		this.buffer = null
	}

	/** the box first, then the traced path: a lasso leaves corners outside it. */
	contains(pt: Point): boolean {
		const { box, mask, source } = this
		if (!box || !insideRect(box, pt)) return false
		if (!mask || !source) return true

		const scratch = probe()
		if (!scratch) return true

		// the path stays where it was drawn while the box moves away from it
		return scratch.isPointInPath(
			mask.path,
			pt.x - (box.x - source.x),
			pt.y - (box.y - source.y),
			mask.rule,
		)
	}

	/**
	 * picks the pixels up onto a buffer of their own. `erase` leaves colour 2
	 * behind, which is what a move and a cut do and a copy-drag does not.
	 */
	lift(ctx: ToolContext, erase: boolean): void {
		const rect = this.box && clampRect(this.box, ctx.doc)
		if (!rect || this.raw) return

		this.source = rect
		this.box = rect
		this.raw = this.extract(ctx, rect)
		this.buffer = this.shade(ctx, this.raw)
		if (erase) this.erase(ctx)
	}

	/** repaints the floating pixels at their current place on the preview. */
	draw(ctx: ToolContext): void {
		const { buffer, box } = this
		ctx.surface.clearPreview()
		if (!buffer || !box) return

		ctx.preview.drawImage(buffer, box.x, box.y)
	}

	/**
	 * re-applies colour 2 and the transparency switch to pixels already lifted.
	 * the raw copy is what makes it reversible: the knock-out is never baked.
	 */
	refresh(ctx: ToolContext): void {
		if (!this.raw) return

		this.buffer = this.shade(ctx, this.raw)
		this.draw(ctx)
	}

	moveTo(ctx: ToolContext, x: number, y: number): void {
		const box = this.box
		if (!box) return

		const dx = x - box.x
		const dy = y - box.y
		this.box = { ...box, x, y }
		this.outline =
			this.outline?.map((point) => ({ x: point.x + dx, y: point.y + dy })) ??
			null
		this.draw(ctx)
	}

	/** Shift-drag drops a copy at each step, which is Paint's stamp trail. */
	stamp(ctx: ToolContext): void {
		const { buffer, box } = this
		if (!buffer || !box) return

		const dirty = clampRect(box, ctx.doc)
		if (!dirty) return

		ctx.markDirty(dirty)
		ctx.base.drawImage(buffer, box.x, box.y)
	}

	moveBy(ctx: ToolContext, dx: number, dy: number): void {
		if (!this.box) return

		this.moveTo(ctx, this.box.x + dx, this.box.y + dy)
	}

	/**
	 * the floating pixels are about to be flattened: the step has to cover both
	 * the hole they left and the place they land.
	 */
	commit(ctx: ToolContext): void {
		const { buffer, box, source } = this
		if (!buffer || !box) return

		const dirty = clampRect(source ? rectUnion(box, source) : box, ctx.doc)
		if (dirty) ctx.markDirty(dirty)
		this.draw(ctx)
		this.raw = null
		this.buffer = null
		this.source = box
	}

	/** paints colour 2 over the region, which is Delete and half of Cut. */
	erase(ctx: ToolContext): void {
		const rect = this.box && clampRect(this.box, ctx.doc)
		if (!rect) return

		ctx.markDirty(rect)
		ctx.base.save()
		ctx.base.fillStyle = ctx.color2
		if (this.mask) ctx.base.fill(this.mask.path, this.mask.rule)
		else ctx.base.fillRect(rect.x, rect.y, rect.w, rect.h)
		ctx.base.restore()
	}

	/** the selected pixels, off the buffer when floating and off base if not. */
	read(ctx: ToolContext): ImageData | null {
		const rect = this.box && clampRect(this.box, ctx.doc)
		if (!rect) return null

		const source = this.shade(ctx, this.raw ?? this.extract(ctx, rect))
		return (
			source
				.getContext("2d")
				?.getImageData(0, 0, source.width, source.height) ?? null
		)
	}

	/**
	 * picks everything the region leaves out. the whole document plus the old
	 * region, filled by the even-odd rule, is the hole it cuts.
	 */
	invert(ctx: ToolContext): void {
		const box = this.box
		if (!box) return

		const { width, height } = ctx.doc
		const path = new Path2D()
		path.rect(0, 0, width, height)
		if (this.mask) path.addPath(this.mask.path)
		else path.rect(box.x, box.y, box.w, box.h)

		this.define(
			"free",
			{ x: 0, y: 0, w: width, h: height },
			{ path, rule: "evenodd" },
		)
	}

	/** a pasted picture arrives already floating, at the top left corner. */
	adopt(ctx: ToolContext, bitmap: ImageBitmap): void {
		const canvas = canvasOf(bitmap.width, bitmap.height)
		canvas.getContext("2d")?.drawImage(bitmap, 0, 0)

		this.shape = "rect"
		this.mask = null
		this.outline = null
		this.raw = canvas
		this.buffer = canvas
		this.box = { x: 0, y: 0, w: bitmap.width, h: bitmap.height }
		this.source = this.box
		this.draw(ctx)
	}

	/**
	 * copies the region onto a canvas of its own, through the free-form path
	 * when there is one. the pixels arrive exactly as they sit on the base.
	 */
	private extract(ctx: ToolContext, rect: Rect): HTMLCanvasElement {
		const canvas = canvasOf(rect.w, rect.h)
		const target = canvas.getContext("2d")
		if (!target) return canvas

		if (this.mask) {
			target.save()
			target.translate(-rect.x, -rect.y)
			target.fill(this.mask.path, this.mask.rule)
			target.restore()
			target.globalCompositeOperation = "source-in"
		}
		target.drawImage(ctx.base.canvas, -rect.x, -rect.y)

		return canvas
	}

	/**
	 * transparent selection, applied to a copy rather than to the pixels: the
	 * switch and colour 2 both stay live while the selection floats.
	 */
	private shade(
		ctx: ToolContext,
		source: HTMLCanvasElement,
	): HTMLCanvasElement {
		if (!ctx.transparent) return source

		const canvas = canvasOf(source.width, source.height)
		const target = canvas.getContext("2d")
		if (!target) return source

		target.drawImage(source, 0, 0)
		knockOut(target, canvas.width, canvas.height, ctx.color2)
		return canvas
	}
}

/** every pixel holding exactly colour 2 turns clear, with no tolerance. */
function knockOut(
	target: CanvasRenderingContext2D,
	width: number,
	height: number,
	color: string,
): void {
	const image = target.getImageData(0, 0, width, height)
	const { r, g, b } = hexToRgba(color)
	const data = image.data

	for (let i = 0; i < data.length; i += 4) {
		if (data[i] === r && data[i + 1] === g && data[i + 2] === b) data[i + 3] = 0
	}
	target.putImageData(image, 0, 0)
}
