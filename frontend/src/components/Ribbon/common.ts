import { NO_FILL_KEY } from "./constant"
import type { ShapeKind, StrokeStyle } from "store/types"

/** maximum scroll row for a grid gallery. */
export function maxGalleryRow(
	total: number,
	cols: number,
	visibleRows: number,
): number {
	return Math.max(0, Math.ceil(total / cols) - visibleRows)
}

/**
 * Outline and Fill are disabled for Line and Curve because neither has an interior.
 */
export function shapeHasInterior(shape: ShapeKind): boolean {
	return shape !== "line" && shape !== "curve"
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
