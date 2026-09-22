import {
	BRUSH_SPECS,
	GRAIN_DENSITY,
	GRAIN_TILE,
	STROKE_TEXTURES,
} from "common/constant"
import { hexToRgba } from "engine/color"
import type { BrushNib, BrushPaint, BrushSpec } from "types/engine.types"
import type { Point, StrokeStyle } from "types/store.types"

const DEG = Math.PI / 180

/** one tile per color, kept for the life of the page. */
const grains = new Map<string, CanvasPattern | null>()

const SOLID: BrushSpec = { width: 1, alpha: 1 }

/** stroke width in image pixels, which every other measure is relative to. */
export function brushWidth(spec: BrushSpec, size: number): number {
	return Math.max(1, spec.width * size)
}

/**
 * the texture behind an outline or fill style. crayon, marker, oil, natural
 * pencil and watercolor borrow the brush of the same name; solid has none.
 */
export function styleSpec(style: StrokeStyle): BrushSpec {
	const brush = STROKE_TEXTURES[style]
	return brush ? BRUSH_SPECS[brush] : SOLID
}

/** how far the paint reaches beyond the line it was drawn along. */
export function brushSpread(spec: BrushSpec, width: number): number {
	const spray = spec.spray ? spec.spray.radius * width : 0
	const jitter = (spec.jitter ?? 0) * width
	return Math.ceil(width / 2 + Math.max(spray, jitter) + (spec.blur ?? 0) * 2)
}

/** one straight piece of a free-hand stroke, in image pixels. */
export function paintSegment(paint: BrushPaint, a: Point, b: Point): void {
	const { spec } = paint

	withPaint(paint, (dx, dy) => {
		if (spec.spray) {
			sprayDots(paint, a, b, dx, dy)
			return
		}
		if (spec.nib) {
			stampNib(paint, spec.nib, a, b, dx, dy)
			return
		}

		strokeLine(paint, a, b, dx, dy)
	})
}

/** a shape outline drawn in the texture the Outline menu picked. */
export function strokeStyledPath(paint: BrushPaint, path: Path2D): void {
	withPaint(paint, (dx, dy) => {
		paint.target.translate(dx, dy)
		paint.target.stroke(path)
	})
}

/** the interior of a shape, in the texture the Fill menu picked. */
export function fillStyledPath(paint: BrushPaint, path: Path2D): void {
	withPaint(paint, (dx, dy) => {
		paint.target.translate(dx, dy)
		paint.target.fill(path)
	})
}

/**
 * sets color, opacity and texture, then runs `draw` once per pass. an oil
 * brush lays several passes beside one another, everything else exactly one.
 */
function withPaint(
	paint: BrushPaint,
	draw: (dx: number, dy: number) => void,
): void {
	const { target, spec } = paint
	const grain = spec.grain ? grainPattern(target, paint.color) : null
	const passes = spec.passes ?? 1
	const jitter = (spec.jitter ?? 0) * paint.width

	target.save()
	target.globalAlpha = Math.max(0, Math.min(1, spec.alpha * paint.fade))
	if (spec.multiply) target.globalCompositeOperation = "multiply"
	if (spec.blur) target.filter = `blur(${spec.blur}px)`
	target.fillStyle = grain ?? paint.color
	target.strokeStyle = grain ?? paint.color
	target.lineWidth = paint.width
	target.lineCap = "round"
	target.lineJoin = "round"

	for (let pass = 0; pass < passes; pass++) {
		const spread = passes > 1 ? (pass / (passes - 1) - 0.5) * 2 * jitter : 0
		target.save()
		draw(spread, spread)
		target.restore()
	}
	target.restore()
}

function strokeLine(
	paint: BrushPaint,
	a: Point,
	b: Point,
	dx: number,
	dy: number,
): void {
	const { target } = paint
	if (a.x === b.x && a.y === b.y) {
		target.beginPath()
		target.arc(a.x + dx, a.y + dy, paint.width / 2, 0, Math.PI * 2)
		target.fill()
		return
	}

	target.beginPath()
	target.moveTo(a.x + dx, a.y + dy)
	target.lineTo(b.x + dx, b.y + dy)
	target.stroke()
}

/**
 * a flat nib held at a fixed angle. the canvas is turned once and the nib then
 * stamps along the segment in half-pixel steps, which leaves no gap in it.
 */
function stampNib(
	paint: BrushPaint,
	nib: BrushNib,
	a: Point,
	b: Point,
	dx: number,
	dy: number,
): void {
	const { target } = paint
	const angle = nib.angle * DEG
	const long = paint.width
	const short = Math.max(1, paint.width * nib.thickness)
	const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2))
	const cos = Math.cos(-angle)
	const sin = Math.sin(-angle)

	target.rotate(angle)
	for (let i = 0; i <= steps; i++) {
		const t = i / steps
		const x = a.x + (b.x - a.x) * t + dx
		const y = a.y + (b.y - a.y) * t + dy
		target.fillRect(
			x * cos - y * sin - long / 2,
			x * sin + y * cos - short / 2,
			long,
			short,
		)
	}
}

/** the airbrush scatter: single pixels thrown into a disc along the segment. */
function sprayDots(
	paint: BrushPaint,
	a: Point,
	b: Point,
	dx: number,
	dy: number,
): void {
	const spray = paint.spec.spray
	if (!spray) return

	const { target } = paint
	const radius = spray.radius * paint.width
	const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)))

	for (let i = 0; i <= steps; i++) {
		const t = i / steps
		const cx = a.x + (b.x - a.x) * t + dx
		const cy = a.y + (b.y - a.y) * t + dy
		for (let dot = 0; dot < spray.rate; dot++) {
			// the square root spreads the dots evenly over the disc rather than
			// piling them up in the middle
			const away = radius * Math.sqrt(Math.random())
			const around = Math.random() * Math.PI * 2
			target.fillRect(
				Math.floor(cx + away * Math.cos(around)),
				Math.floor(cy + away * Math.sin(around)),
				1,
				1,
			)
		}
	}
}

/**
 * noise pre-rendered once per color and repeated as a pattern. node has no
 * document and never paints, which is what the guard is for.
 */
function grainPattern(
	target: CanvasRenderingContext2D,
	color: string,
): CanvasPattern | null {
	const cached = grains.get(color)
	if (cached !== undefined) return cached

	if (typeof document === "undefined") return null

	const tile = document.createElement("canvas")
	tile.width = GRAIN_TILE
	tile.height = GRAIN_TILE
	const ctx = tile.getContext("2d")
	if (!ctx) return null

	const { r, g, b } = hexToRgba(color)
	const noise = ctx.createImageData(GRAIN_TILE, GRAIN_TILE)
	for (let i = 0; i < noise.data.length; i += 4) {
		noise.data[i] = r
		noise.data[i + 1] = g
		noise.data[i + 2] = b
		noise.data[i + 3] = Math.random() < GRAIN_DENSITY ? 255 : 0
	}
	ctx.putImageData(noise, 0, 0)

	const pattern = target.createPattern(tile, "repeat")
	grains.set(color, pattern)
	return pattern
}
