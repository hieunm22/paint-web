import { BOX_CURSORS, MOVE_CURSOR, SHAPE_DEFS } from "common/constant"
import { fillStyledPath, strokeStyledPath, styleSpec } from "engine/brushes"
import {
	boundsOfPoints,
	boxHandles,
	clampPoint,
	clampRect,
	constrainToAxis,
	inflateRect,
	insideRect,
	nearestGrip,
	rectFromPoints,
	remapPoints,
	resizeBox,
	squareFromPoints,
} from "engine/geometry"
import { reportDraft } from "engine/overlay"
import { buildCurvePath, buildPolygonPath, buildShapePath } from "engine/shapes"
import { translate } from "locales/translate"
import type {
	Modifiers,
	ShapeDraft,
	Tool,
	ToolContext,
} from "types/engine.types"
import type {
	Point,
	Rect,
	ShapeKind,
	ToolId,
} from "types/store.types"

const ORIGIN: Point = { x: 0, y: 0 }

/** a curve takes two bends after the first drag, as Paint's does. */
const CURVE_BENDS = 2

/** a polygon closes when the last click lands this near its first corner. */
const CLOSE_REACH = 6

type Mode = "draw" | "move" | "resize" | "bend" | "vertex"

/**
 * every gallery shape through one tool. a released shape stays editable on the
 * preview layer until Enter, a click outside or a change of tool bakes it.
 */
export class ShapeTool implements Tool {
	readonly id: ToolId = "shape"

	get label(): string {
		return translate("history.label.shape")
	}

	private draft: ShapeDraft | null = null
	private mode: Mode | null = null
	private anchor: Point = ORIGIN
	private origin: Rect = { x: 0, y: 0, w: 0, h: 0 }
	private grip = 0

	begin(pt: Point, mods: Modifiers, ctx: ToolContext): void {
		const at = clampPoint(pt, ctx.doc)
		const draft = this.draft

		if (draft) {
			const grip = this.gripAt(at, ctx)
			if (grip >= 0) {
				this.mode = "resize"
				this.grip = grip
				this.origin = draft.box
				this.anchor = at
				return
			}
			if (this.unfinished(draft)) {
				if (draft.open) this.addVertex(at, ctx)
				else {
					this.mode = "bend"
					draft.controls.push(at)
					this.paint(ctx)
				}
				return
			}
			if (insideRect(draft.box, at)) {
				this.mode = "move"
				this.anchor = at
				this.origin = draft.box
				return
			}
		}

		this.mode = "draw"
		this.anchor = at
		this.draft = {
			kind: ctx.shape,
			swapped: mods.secondary,
			box: { x: at.x, y: at.y, w: 0, h: 0 },
			from: at,
			to: at,
			controls: [],
			points: [at],
			open: ctx.shape === "polygon",
		}
		if (this.draft.open) this.mode = "vertex"
		this.paint(ctx)
	}

	update(pts: Point[], mods: Modifiers, ctx: ToolContext): void {
		const draft = this.draft
		const raw = pts[pts.length - 1]
		if (!draft || !raw) return

		const at = clampPoint(raw, ctx.doc)
		if (this.mode === "draw" || this.mode === "vertex") this.stretch(at, mods)
		else if (this.mode === "move") this.shift(at)
		else if (this.mode === "resize") this.resize(at)
		else if (this.mode === "bend") {
			draft.controls[draft.controls.length - 1] = at
		}

		this.paint(ctx)
	}

	end(pt: Point, _mods: Modifiers, ctx: ToolContext): void {
		const draft = this.draft
		if (!draft) return

		if (this.mode === "vertex") {
			// a click that did not drag leaves the polygon open for the next one
			const at = clampPoint(pt, ctx.doc)
			draft.points[draft.points.length - 1] = at
		}
		this.mode = null
		this.paint(ctx)
	}

	isPending(): boolean {
		return this.draft !== null
	}

	/** while a polygon or a curve is unfinished, every click belongs to it. */
	hitTest(pt: Point, ctx: ToolContext): boolean {
		const draft = this.draft
		if (!draft) return false
		if (this.unfinished(draft)) return true

		return this.gripAt(pt, ctx) >= 0 || insideRect(draft.box, pt)
	}

	/**
	 * a handle shows the arrow it drags along and the body shows the move
	 * cross, which is the only hint that a dropped shape is still editable.
	 */
	cursorAt(pt: Point, ctx: ToolContext): string | null {
		const draft = this.draft
		if (!draft) return null

		// the first drag draws the shape out rather than resizing it
		if (this.mode === "resize") return this.gripCursor(this.grip)
		if (this.mode) return this.mode === "move" ? MOVE_CURSOR : null
		if (draft.open) return null

		const grip = this.gripAt(pt, ctx)
		if (grip >= 0) return this.gripCursor(grip)

		return insideRect(draft.box, pt) ? MOVE_CURSOR : null
	}

	/** a line or a curve carries loose endpoints rather than a box to stretch. */
	private gripCursor(grip: number): string {
		const draft = this.draft
		const boxed = draft && draft.kind !== "line" && draft.kind !== "curve"

		return (boxed && BOX_CURSORS[grip]) || MOVE_CURSOR
	}

	/** a multi-step shape owns every click until it closes or runs out of bends. */
	private unfinished(draft: ShapeDraft): boolean {
		if (!SHAPE_DEFS[draft.kind].multiStep) return false

		return draft.kind === "polygon"
			? draft.open
			: draft.controls.length < CURVE_BENDS
	}

	commit(ctx: ToolContext): void {
		const draft = this.draft
		if (!draft) return

		if (draft.open) draft.open = false
		this.paint(ctx, false)
		const dirty = clampRect(inflateRect(draft.box, ctx.size + 2), ctx.doc)
		if (dirty) ctx.markDirty(dirty)
		this.draft = null
		this.mode = null
		reportDraft(null)
	}

	cancel(ctx: ToolContext): void {
		this.draft = null
		this.mode = null
		ctx.surface.clearPreview()
		reportDraft(null)
	}

	repaint(ctx: ToolContext): void {
		if (this.draft) this.paint(ctx)
	}

	/** the box the drag spans, with Shift forcing a square or a 45 degree line. */
	private stretch(at: Point, mods: Modifiers): void {
		const draft = this.draft
		if (!draft) return

		if (draft.kind === "line" || draft.kind === "curve") {
			draft.to = mods.shift ? constrainToAxis(draft.from, at) : at
			draft.box = rectFromPoints(draft.from, draft.to)
			return
		}
		if (draft.open) {
			draft.points[draft.points.length - 1] = at
			draft.box = boundsOfPoints(draft.points) ?? draft.box
			return
		}

		const corner = mods.shift ? squareFromPoints(this.anchor, at) : at
		draft.box = rectFromPoints(this.anchor, corner)
	}

	private shift(at: Point): void {
		const draft = this.draft
		if (!draft) return

		this.place({
			...draft.box,
			x: this.origin.x + (at.x - this.anchor.x),
			y: this.origin.y + (at.y - this.anchor.y),
		})
	}

	/** drags one handle, keeping the opposite side of the box where it is. */
	private resize(at: Point): void {
		this.place(resizeBox(this.origin, this.grip, at))
	}

	/** moves the whole draft into a new box, points and ends included. */
	private place(box: Rect): void {
		const draft = this.draft
		if (!draft) return

		const [from, to] = remapPoints([draft.from, draft.to], draft.box, box)
		draft.controls = remapPoints(draft.controls, draft.box, box)
		draft.points = remapPoints(draft.points, draft.box, box)
		draft.from = from
		draft.to = to
		draft.box = box
	}

	private addVertex(at: Point, ctx: ToolContext): void {
		const draft = this.draft
		if (!draft) return

		const first = draft.points[0]
		const last = draft.points[draft.points.length - 1]
		// the second click of a double click lands on the corner just placed
		if (near(at, first) || near(at, last)) {
			draft.open = false
			this.mode = null
			this.paint(ctx)
			return
		}

		draft.points.push(at)
		draft.box = boundsOfPoints(draft.points) ?? draft.box
		this.mode = "vertex"
		this.paint(ctx)
	}

	/** which handle the pointer grabbed, or -1. the reach follows the zoom. */
	private gripAt(pt: Point, ctx: ToolContext): number {
		const draft = this.draft
		if (!draft || draft.open) return -1

		return nearestGrip(this.handles(), pt, ctx.zoom)
	}

	/** the endpoints of a line or curve, the box handles of everything else. */
	private handles(): Point[] {
		const draft = this.draft
		if (!draft) return []
		if (draft.kind === "line" || draft.kind === "curve") {
			return [draft.from, draft.to, ...draft.controls]
		}

		return boxHandles(draft.box)
	}

	private pathOf(draft: ShapeDraft): Path2D {
		if (draft.kind === "line" || draft.kind === "curve") {
			return buildCurvePath(draft.from, draft.to, draft.controls)
		}
		if (draft.kind === "polygon") {
			return buildPolygonPath(draft.points, !draft.open)
		}

		return buildShapePath(draft.kind, draft.box) ?? new Path2D()
	}

	/** repaints the draft on preview and republishes its handles. */
	private paint(ctx: ToolContext, guides = true): void {
		const draft = this.draft
		if (!draft) return

		const { preview } = ctx
		ctx.surface.clearPreview()
		const path = this.pathOf(draft)
		const stroke = draft.swapped ? ctx.color2 : ctx.color1
		const fill = draft.swapped ? ctx.color1 : ctx.color2

		if (ctx.fill !== "none" && fillable(draft.kind)) {
			fillStyledPath(
				{
					target: preview,
					spec: styleSpec(ctx.fill),
					color: fill,
					width: ctx.size,
					fade: 1,
				},
				path,
			)
		}
		// a line and a curve have no interior, and no outline setting either
		if (ctx.outline !== "none" || !fillable(draft.kind)) {
			strokeStyledPath(
				{
					target: preview,
					spec: styleSpec(ctx.outline),
					color: stroke,
					width: ctx.size,
					fade: 1,
				},
				path,
			)
		}

		reportDraft(
			guides
				? { bounds: draft.open ? null : draft.box, handles: this.handles() }
				: null,
		)
	}
}

function fillable(kind: ShapeKind): boolean {
	return SHAPE_DEFS[kind].fillable
}

function near(a: Point, b: Point): boolean {
	return Math.hypot(a.x - b.x, a.y - b.y) <= CLOSE_REACH
}
