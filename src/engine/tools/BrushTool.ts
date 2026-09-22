import {
	BRUSH_DRY_LENGTH,
	BRUSH_FULL_SPEED,
	BRUSH_SPECS,
	SPRAY_INTERVAL_MS,
} from "common/constant"
import { brushSpread, brushWidth, paintSegment } from "engine/brushes"
import { clampRect, segmentBounds } from "engine/geometry"
import { pressureSpec } from "engine/pressure"
import { translate } from "locales/translate"
import type {
	BrushSpec,
	Modifiers,
	StrokePoint,
	Tool,
	ToolContext,
} from "types/engine.types"

const ORIGIN: StrokePoint = { x: 0, y: 0, pressure: null, tilt: null }

/**
 * the nine brushes, one tool driven by a table of parameters. paint builds up
 * on preview across the gesture, which is what lets a low opacity darken.
 */
export class BrushTool implements Tool {
	readonly id = "brush"

	get label(): string {
		return translate("history.label.brush")
	}
	private last: StrokePoint = ORIGIN
	/** stroke length so far, which is what dries an oil brush out. */
	private travelled = 0
	private spraying: ReturnType<typeof setInterval> | null = null

	begin(pt: StrokePoint, mods: Modifiers, ctx: ToolContext): void {
		this.last = pt
		this.travelled = 0
		this.paint(pt, pt, mods, ctx)

		// the airbrush is the one brush that keeps painting while the pointer
		// stands still, exactly as a real can of spray does
		if (!BRUSH_SPECS[ctx.brush].spray) return
		this.spraying = setInterval(() => {
			this.paint(this.last, this.last, mods, ctx)
		}, SPRAY_INTERVAL_MS)
	}

	update(pts: StrokePoint[], mods: Modifiers, ctx: ToolContext): void {
		for (const pt of pts) {
			this.paint(this.last, pt, mods, ctx)
			this.last = pt
		}
	}

	end(): void {
		this.stopSpraying()
	}

	cancel(): void {
		this.stopSpraying()
	}

	private paint(
		a: StrokePoint,
		b: StrokePoint,
		mods: Modifiers,
		ctx: ToolContext,
	): void {
		// the segment is painted as the pen was holding it when it arrived
		const spec = pressureSpec(BRUSH_SPECS[ctx.brush], b)
		const width = brushWidth(spec, ctx.size)
		const gap = Math.hypot(b.x - a.x, b.y - a.y)
		this.travelled += gap

		const spread = brushSpread(spec, width)
		const dirty = clampRect(segmentBounds(a, b, spread * 2), ctx.doc)
		if (!dirty) return

		ctx.markDirty(dirty)
		paintSegment(
			{
				target: ctx.preview,
				spec,
				color: mods.secondary ? ctx.color2 : ctx.color1,
				width,
				fade: this.fade(spec, gap),
			},
			a,
			b,
		)
	}

	/**
	 * the two brushes whose weight is not constant: a natural pencil goes pale
	 * as the hand speeds up, an oil brush as the stroke runs on.
	 */
	private fade(spec: BrushSpec, gap: number): number {
		let fade = 1
		if (spec.speed) {
			const [slow, fast] = spec.speed
			const rate = Math.min(1, gap / BRUSH_FULL_SPEED)
			fade = (slow + (fast - slow) * rate) / spec.alpha
		}
		if (spec.dry) {
			const spent = Math.min(1, this.travelled / BRUSH_DRY_LENGTH)
			fade *= 1 - (1 - spec.dry) * spent
		}

		return fade
	}

	private stopSpraying(): void {
		if (this.spraying === null) return

		clearInterval(this.spraying)
		this.spraying = null
	}
}
