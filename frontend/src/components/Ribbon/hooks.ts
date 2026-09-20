import { useMemo, useState } from "react"
import {
	FONT_FAMILIES,
	SHAPE_GALLERY_COLS,
	SHAPE_GALLERY_VISIBLE_ROWS,
} from "./constant"
import { availableFonts } from "common/fonts"
import { maxGalleryRow } from "./common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setTextOptions } from "store/slices/toolSlice"
import type { TextOptions } from "types/store.types"
import type { FontStyleId, TextRibbonState } from "./types"

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
		scrollUp: () => setRow(r => Math.max(0, r - 1)),
		scrollDown: () => setRow(r => Math.min(maxRow, r + 1)),
	}
}

/**
 * the families the machine actually carries. the one already in use stays on
 * the list wherever it is missing, or the box would show no selection at all.
 */
export function useFontFamilies(current: string): string[] {
	return useMemo(() => {
		const found = availableFonts(FONT_FAMILIES)
		return found.includes(current) ? found : [current, ...found]
	}, [current])
}

/**
 * the Font and Background groups over one slice of state. a live text box
 * reads the same options, which is what makes a change show as you make it.
 */
export function useTextRibbon(): TextRibbonState {
	const dispatch = useAppDispatch()
	const options = useAppSelector(s => s.tool.text)

	return {
		options,
		setFamily: fontFamily => dispatch(setTextOptions({ fontFamily })),
		setSize: fontSize => dispatch(setTextOptions({ fontSize })),
		toggleStyle: (id: FontStyleId) =>
			dispatch(setTextOptions({ [id]: !options[id] })),
		setBackground: (background: TextOptions["background"]) =>
			dispatch(setTextOptions({ background })),
	}
}
