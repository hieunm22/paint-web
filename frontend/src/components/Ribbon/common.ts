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
 * the Fill menu shows "No fill" instead of "No outline" for the `none` entry.
 */
export function strokeStyleLabel(
	id: StrokeStyle,
	baseLabel: string,
	isFill: boolean,
): string {
	return id === "none" && isFill ? "No fill" : baseLabel
}
