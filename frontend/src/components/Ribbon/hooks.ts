import { useState } from "react"
import { maxGalleryRow } from "./common"
import { SHAPE_GALLERY_COLS, SHAPE_GALLERY_VISIBLE_ROWS } from "./constant"

/** scrolls the shape gallery one row at a time. */
export function useShapeGalleryScroll(totalShapes: number) {
	const [row, setRow] = useState(0)
	const maxRow = maxGalleryRow(
		totalShapes,
		SHAPE_GALLERY_COLS,
		SHAPE_GALLERY_VISIBLE_ROWS,
	)

	return {
		row,
		maxRow,
		canScrollUp: row > 0,
		canScrollDown: row < maxRow,
		scrollUp: () => setRow((r) => Math.max(0, r - 1)),
		scrollDown: () => setRow((r) => Math.min(maxRow, r + 1)),
	}
}
