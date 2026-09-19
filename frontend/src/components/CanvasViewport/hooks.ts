import { useEffect, useMemo, useRef, type PointerEvent } from "react"
import { isSecondaryButton } from "common/platform"
import { screenToImage } from "./common"
import { reportCursor } from "engine/cursor"
import { paint } from "engine/PaintEngine"
import type { Modifiers } from "engine/types"
import type { Point } from "store/types"

type CanvasPointerEvent = PointerEvent<HTMLCanvasElement>

/**
 * keeps the engine's surface in step with the document and the viewport.
 * the engine owns the canvas bitmaps, react only sets their css size.
 */
export function useSurface(width: number, height: number) {
	const baseRef = useRef<HTMLCanvasElement>(null)
	const previewRef = useRef<HTMLCanvasElement>(null)
	const overlayRef = useRef<HTMLCanvasElement>(null)
	const paneRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const base = baseRef.current
		const preview = previewRef.current
		const overlay = overlayRef.current
		if (!base || !preview || !overlay) return

		paint.attach({ base, preview, overlay })
		return () => paint.detach()
	}, [])

	useEffect(() => {
		paint.resizeDocument({ width, height })
	}, [width, height])

	// the overlay is screen-sized: it follows the pane rather than the document
	useEffect(() => {
		const pane = paneRef.current
		if (!pane) return

		const observer = new ResizeObserver((entries) => {
			const box = entries[entries.length - 1]?.contentRect
			if (!box) return
			paint.surface.resizeOverlay({ width: box.width, height: box.height })
		})
		observer.observe(pane)
		return () => observer.disconnect()
	}, [])

	return { baseRef, previewRef, overlayRef, paneRef }
}

/**
 * drives the engine straight from the pointer and feeds the throttled cursor
 * store. nothing here dispatches: a move must not re-render the app.
 * memoised so the canvas keeps one handler identity across renders.
 */
export function usePointerTools(zoom: number) {
	return useMemo(
		() => ({
			onPointerDown: (e: CanvasPointerEvent) => {
				if (e.button !== 0 && e.button !== 2) return

				e.currentTarget.setPointerCapture(e.pointerId)
				paint.begin(pointOf(e, zoom), modifiersOf(e))
			},
			onPointerMove: (e: CanvasPointerEvent) => {
				const points = coalescedPoints(e, zoom)
				reportCursor(points[points.length - 1] ?? null)
				paint.update(points, modifiersOf(e))
			},
			onPointerUp: (e: CanvasPointerEvent) => {
				paint.end(pointOf(e, zoom), modifiersOf(e))
			},
			onPointerCancel: () => paint.cancel(),
			onPointerLeave: () => {
				if (!paint.isDrawing) reportCursor(null)
			},
			// right-drag paints colour 2, which the context menu would interrupt
			onContextMenu: (e: CanvasPointerEvent) => e.preventDefault(),
		}),
		[zoom],
	)
}

function pointOf(e: CanvasPointerEvent, zoom: number): Point {
	const rect = e.currentTarget.getBoundingClientRect()
	return screenToImage(e.clientX, e.clientY, rect, zoom)
}

/**
 * a pen fires far faster than the display refreshes; the browser holds the
 * intermediate positions back and hands them over with the event.
 */
function coalescedPoints(e: CanvasPointerEvent, zoom: number): Point[] {
	const rect = e.currentTarget.getBoundingClientRect()
	const native = e.nativeEvent
	const batch = native.getCoalescedEvents?.() ?? []
	const events = batch.length ? batch : [native]

	return events.map((ev) => screenToImage(ev.clientX, ev.clientY, rect, zoom))
}

function modifiersOf(e: CanvasPointerEvent): Modifiers {
	return {
		secondary: isSecondaryButton(e.button, e.ctrlKey),
		shift: e.shiftKey,
		alt: e.altKey,
	}
}
