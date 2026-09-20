import {
	MIN_TILT,
	PRESSURE_ALPHA,
	PRESSURE_RATE,
	PRESSURE_SMOOTHING,
	PRESSURE_WIDTH,
	UNMEASURED_PRESSURE,
} from "common/constant"
import type { BrushSpec, StrokePoint } from "types/engine.types"
import type { Point } from "types/store.types"

const DEG = 180 / Math.PI

/** a pen's force read off one sample, or null where there is no force to read. */
export function penPressure(kind: string, pressure: number): number | null {
	if (kind !== "pen") return null

	// a device that cannot measure reports exactly the middle while it touches
	return pressure === UNMEASURED_PRESSURE || pressure <= 0 ? null : pressure
}

/** the pen's lean, which only a pen reports and only while it is leaning. */
export function penTilt(kind: string, x: number, y: number): Point | null {
	if (kind !== "pen" || Math.hypot(x, y) < MIN_TILT) return null

	return { x, y }
}

/**
 * raw force is noisy enough to visibly notch a stroke's width. one sample is
 * folded into the last, which is what leaves the edge smooth.
 */
export function smoothPressure(
	previous: number | null,
	raw: number | null,
): number | null {
	if (raw === null) return null
	if (previous === null) return raw

	return previous + PRESSURE_SMOOTHING * (raw - previous)
}

/** where a force between nothing and everything sits on a pair of bounds. */
function span([low, high]: [number, number], force: number): number {
	const within = Math.min(1, force)
	const touching = Math.max(0, within)

	return low + (high - low) * touching
}

/** the angle the nib is held at, measured clockwise because y points down. */
function tiltAngle(tilt: Point): number {
	return Math.atan2(tilt.y, tilt.x) * DEG
}

/**
 * the brush one sample of a pen makes. force reaches only the brushes Paint
 * already varies, and a mouse or a finger gets the spec exactly as it stands.
 */
export function pressureSpec(spec: BrushSpec, pen: StrokePoint): BrushSpec {
	const force = pen.pressure
	if (force === null && !pen.tilt) return spec

	const next: BrushSpec = { ...spec }
	// a real nib follows the hand instead of the fixed 45 degrees
	if (spec.nib && pen.tilt) {
		next.nib = { ...spec.nib, angle: tiltAngle(pen.tilt) }
	}
	if (force === null) return next

	if (spec.spray) {
		const share = span(PRESSURE_RATE, force)
		const dots = Math.round(spec.spray.rate * share)
		next.spray = { ...spec.spray, rate: Math.max(1, dots) }
	}
	// the natural pencil goes by force once there is force to go by; without a
	// pen it stays a function of speed
	if (spec.speed) {
		delete next.speed
		next.alpha = spec.alpha * span(PRESSURE_ALPHA, force)
	}
	// watercolour lays fewer and fainter layers under a light touch
	if (spec.blur && spec.passes) {
		const layers = Math.round(spec.passes * force)
		next.passes = Math.max(1, layers)
		next.alpha = spec.alpha * span(PRESSURE_ALPHA, force)
	}
	// oil bristles spread as the hand leans on them
	if (spec.dry) next.width = spec.width * span(PRESSURE_WIDTH, force)

	return next
}
