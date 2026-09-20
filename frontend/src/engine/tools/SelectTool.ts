import {
	boundsOfPoints,
	clampPoint,
	clampRect,
	rectFromPoints,
} from "engine/geometry"
import { reportSelectionBox } from "engine/overlay"
import { buildPolygonPath } from "engine/shapes"
import { translate } from "locales/translate"
import type { Modifiers, Tool, ToolContext } from "types/engine.types"
import type { Point, SelectionKind, ToolId } from "types/store.types"

const ORIGIN: Point = { x: 0, y: 0 }

/** a marquee this small is a click, which drops the selection instead. */
const MIN_SIZE = 2

/** dash pattern of the lasso drawn while a free-form selection is traced. */
const LASSO_DASH = [4, 4]

type Mode = "marquee" | "move" | null

/**
 * rectangular and free-form selection through one class. the pixels live in
 * the shared SelectionManager; this only decides what the pointer means.
 */
export class SelectTool implements Tool {
	readonly id: ToolId

	constructor(id: Extract<ToolId, "select-rect" | "select-free">) {
		this.id = id
	}

	get label(): string {
		return translate("history.label.selection")
	}

	private mode: Mode = null
	private anchor: Point = ORIGIN
	private grabbed: Point = ORIGIN
	private trace: Point[] = []

	private get kind(): SelectionKind {
		return this.id === "select-free" ? "free" : "rect"
	}

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		const at = clampPoint(pt, ctx.doc)
		const selection = ctx.selection

		if (selection.isActive && selection.contains(at)) {
			const box = selection.bounds
			this.mode = "move"
			this.anchor = at
			this.grabbed = { x: box?.x ?? at.x, y: box?.y ?? at.y }
			// Alt or Ctrl leaves the original pixels behind, duplicating them
			selection.lift(ctx, !(mods.alt || mods.ctrl))
			selection.draw(ctx)
			return
		}

		selection.clear()
		ctx.surface.clearPreview()
		this.mode = "marquee"
		this.anchor = at
		this.trace = [at]
		reportSelectionBox(null)
	}

	update(pts: Point[], mods: Modifiers, ctx: ToolContext): void {
		const last = pts[pts.length - 1]
		if (!last) return

		const at = clampPoint(last, ctx.doc)
		if (this.mode === "move") {
			ctx.selection.moveTo(
				ctx,
				this.grabbed.x + (at.x - this.anchor.x),
				this.grabbed.y + (at.y - this.anchor.y),
			)
			if (mods.shift) ctx.selection.stamp(ctx)
			reportSelectionBox(ctx.selection.bounds, ctx.selection.lasso)
			return
		}
		if (this.mode !== "marquee") return

		if (this.kind === "free") {
			for (const point of pts) this.trace.push(clampPoint(point, ctx.doc))
			this.drawLasso(ctx)
			// a copy: the overlay compares what it holds against what arrives
			reportSelectionBox(boundsOfPoints(this.trace), [...this.trace])
			return
		}
		reportSelectionBox(rectFromPoints(this.anchor, at))
	}

	end(pt: Point, _mods: Modifiers, ctx: ToolContext): void {
		const mode = this.mode
		this.mode = null
		if (mode !== "marquee") return

		const at = clampPoint(pt, ctx.doc)
		const free = this.kind === "free"
		const bounds = free
			? boundsOfPoints(this.trace)
			: rectFromPoints(this.anchor, at)
		const box = bounds && clampRect(bounds, ctx.doc)
		ctx.surface.clearPreview()

		if (!box || box.w < MIN_SIZE || box.h < MIN_SIZE) {
			ctx.selection.clear()
			reportSelectionBox(null)
			return
		}

		ctx.selection.define(
			this.kind,
			box,
			free
				? { path: buildPolygonPath(this.trace, true), rule: "nonzero" }
				: null,
			free ? [...this.trace] : null,
		)
		reportSelectionBox(box, ctx.selection.lasso)
	}

	isPending(ctx: ToolContext): boolean {
		return ctx.selection.isActive
	}

	hitTest(pt: Point, ctx: ToolContext): boolean {
		return ctx.selection.contains(pt)
	}

	/** a live colour 2 or transparency change re-shades the floating pixels. */
	repaint(ctx: ToolContext): void {
		ctx.selection.refresh(ctx)
	}

	/** dropping the pixels ends the selection, the way clicking away does. */
	commit(ctx: ToolContext): void {
		ctx.selection.commit(ctx)
		ctx.selection.clear()
		reportSelectionBox(null)
	}

	cancel(ctx: ToolContext): void {
		this.mode = null
		ctx.selection.clear()
		ctx.surface.clearPreview()
		reportSelectionBox(null)
	}

	/** the lasso itself, drawn on preview so the traced path stays visible. */
	private drawLasso(ctx: ToolContext): void {
		const { preview } = ctx
		ctx.surface.clearPreview()
		preview.save()
		preview.setLineDash(LASSO_DASH)
		preview.lineWidth = Math.max(1, 1 / ctx.zoom)
		preview.strokeStyle = "#000000"
		preview.stroke(buildPolygonPath(this.trace, false))
		preview.restore()
	}
}
