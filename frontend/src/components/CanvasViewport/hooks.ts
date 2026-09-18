import { useEffect, useMemo, useRef, type PointerEvent } from "react"
import { screenToImage } from "./common"
import { reportCursor } from "engine/cursor"
import { Surface } from "engine/Surface"

/**
 * owns the Surface and keeps it in step with the document and the viewport.
 * the engine owns the canvas bitmaps, react only sets their css size.
 */
export function useSurface(width: number, height: number) {
	const baseRef = useRef<HTMLCanvasElement>(null)
	const previewRef = useRef<HTMLCanvasElement>(null)
	const overlayRef = useRef<HTMLCanvasElement>(null)
	const paneRef = useRef<HTMLDivElement>(null)
	const instance = useRef<Surface | null>(null)

	if (!instance.current) instance.current = new Surface()
	const surface = instance.current

	useEffect(() => {
		const base = baseRef.current
		const preview = previewRef.current
		const overlay = overlayRef.current
		if (!base || !preview || !overlay) return

		surface.attach({ base, preview, overlay })
		return () => surface.detach()
	}, [surface])

	useEffect(() => {
		surface.resizeDocument({ width, height })
	}, [surface, width, height])

	// the overlay is screen-sized: it follows the pane rather than the document
	useEffect(() => {
		const pane = paneRef.current
		if (!pane) return

		const observer = new ResizeObserver((entries) => {
			const box = entries[entries.length - 1]?.contentRect
			if (!box) return
			surface.resizeOverlay({ width: box.width, height: box.height })
		})
		observer.observe(pane)
		return () => observer.disconnect()
	}, [surface])

	return { surface, baseRef, previewRef, overlayRef, paneRef }
}

/**
 * feeds the pointer position to the throttled cursor store, not to redux.
 * memoised: the canvas keeps one handler identity across renders.
 */
export function useCursorReadout(zoom: number) {
	return useMemo(
		() => ({
			onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => {
				const rect = e.currentTarget.getBoundingClientRect()
				reportCursor(screenToImage(e.clientX, e.clientY, rect, zoom))
			},
			onPointerLeave: () => reportCursor(null),
		}),
		[zoom],
	)
}
