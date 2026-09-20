import { useEffect, useState, useSyncExternalStore } from "react"
import { MIME_TYPES } from "common/constant"
import { SIZE_ESTIMATE_MS } from "./constant"
import { getCursor, subscribeCursor } from "engine/cursor"
import { getOverlayState, subscribeOverlay } from "engine/overlay"
import { paint } from "engine/PaintEngine"
import { useAppSelector } from "store/hooks"
import type { Rect } from "types/store.types"

/** live pointer position, subscribed outside redux to limit re-renders to this cell. */
export function useCursorPosition() {
	return useSyncExternalStore(subscribeCursor, getCursor)
}

function selectionBox(): Rect | null {
	const { selection, draft } = getOverlayState()
	return selection ?? draft?.bounds ?? null
}

/** the selection or the shape being dragged; redux only hears about it at rest. */
export function useSelectionBox() {
	return useSyncExternalStore(subscribeOverlay, selectionBox)
}

/**
 * the size the picture would take on disk, measured by encoding it rather than
 * guessed from its dimensions. lazy on purpose: a cosmetic cell is not worth
 * encoding a large canvas on every stroke, so it waits a second for the picture
 * to settle and re-measures only when a step lands or the format changes.
 */
export function useEncodedSize(): number | null {
	const { width, height, format } = useAppSelector(s => s.doc)
	const revision = useAppSelector(s => s.history.revision)
	const [bytes, setBytes] = useState<number | null>(null)

	useEffect(() => {
		const canvas = paint.surface.baseContext?.canvas
		if (!canvas) return

		let live = true
		const timer = setTimeout(() => {
			canvas.toBlob(blob => {
				if (live) setBytes(blob?.size ?? null)
			}, MIME_TYPES[format])
		}, SIZE_ESTIMATE_MS)

		return () => {
			live = false
			clearTimeout(timer)
		}
	}, [width, height, format, revision])

	return bytes
}
