import { SHAPE_DEFS } from "common/constant"
import { NO_FILL_KEY } from "./constant"
import type { ShapeKind, StrokeStyle } from "types/store.types"

/** maximum scroll row for a grid gallery. */
export function maxGalleryRow(
	total: number,
	cols: number,
	visibleRows: number,
): number {
	return Math.max(0, Math.ceil(total / cols) - visibleRows)
}

/**
 * Fill is disabled for a shape with no interior, Line and Curve today. Outline
 * stays live: it is the style of the stroke itself.
 */
export function shapeHasInterior(shape: ShapeKind): boolean {
	return SHAPE_DEFS[shape].fillable
}

/**
 * the Fill menu names its `none` entry differently from the Outline menu.
 */
export function strokeStyleKey(
	id: StrokeStyle,
	baseKey: string,
	isFill: boolean,
): string {
	return id === "none" && isFill ? NO_FILL_KEY : baseKey
}
