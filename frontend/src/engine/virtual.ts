import { VIRTUAL_DOC_SIDE, VIRTUAL_PAD, VIRTUAL_ZOOM } from "common/constant"
import type { Size } from "types/engine.types"
import type { Rect } from "types/store.types"

/**
 * whether the picture is shown through a window onto the visible part rather
 * than as one canvas the size of the whole document.
 */
export function needsVirtual(doc: Size, zoom: number): boolean {
	if (!doc.width || !doc.height) return false

	const longest = Math.max(doc.width, doc.height)
	return longest > VIRTUAL_DOC_SIDE || zoom >= VIRTUAL_ZOOM
}

/**
 * the part of the picture the dom holds: what the viewport shows, widened by
 * a margin against a scroll mid-frame and clipped to the paper.
 */
export function viewWindow(doc: Size, view: Rect | null, zoom: number): Rect {
	if (!doc.width || !doc.height) return { x: 0, y: 0, w: 0, h: 0 }
	if (!view) return { x: 0, y: 0, w: 0, h: 0 }

	const pad = Math.ceil(VIRTUAL_PAD / zoom)
	const left = Math.max(0, Math.floor(view.x) - pad)
	const top = Math.max(0, Math.floor(view.y) - pad)
	const right = Math.min(doc.width, Math.ceil(view.x + view.w) + pad)
	const bottom = Math.min(doc.height, Math.ceil(view.y + view.h) + pad)

	return {
		x: left,
		y: top,
		w: Math.max(0, right - left),
		h: Math.max(0, bottom - top),
	}
}

/** the whole paper, which is the window a document small enough gets. */
export function wholeDocument(doc: Size): Rect {
	return { x: 0, y: 0, w: doc.width, h: doc.height }
}
