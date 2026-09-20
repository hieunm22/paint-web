import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
	type ChangeEvent,
	type PointerEvent,
	type RefObject,
	type UIEvent,
} from "react"
import { TEXT_PADDING } from "common/constant"
import { CANVAS_MARGIN } from "./constant"
import { isSecondaryButton } from "common/platform"
import { screenToImage, visiblePixel } from "./common"
import { reportCursor } from "engine/cursor"
import { getOverlayState, subscribeOverlay } from "engine/overlay"
import { paint } from "engine/PaintEngine"
import { reportVisibleOrigin } from "engine/viewport"
import type { Modifiers, OverlayState } from "types/engine.types"
import type {
	Point,
	Rect,
	ToolId,
	ZoomFocus,
} from "types/store.types"
import type { PointerBatch, TextDragSession } from "./types"

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

		const observer = new ResizeObserver(entries => {
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
export function usePointerTools(
	zoom: number,
	paneRef: RefObject<HTMLDivElement>,
) {
	const batch = useRef<PointerBatch>({
		points: [],
		mods: { secondary: false, shift: false, alt: false, ctrl: false },
		frame: null,
	})

	return useMemo(() => {
		const draw = () => {
			const held = batch.current
			held.frame = null
			if (!held.points.length) return

			paint.update(held.points, held.mods)
			held.points = []
		}
		const discard = () => {
			const held = batch.current
			if (held.frame !== null) cancelAnimationFrame(held.frame)
			held.frame = null
			held.points = []
		}

		return {
			onPointerDown: (e: CanvasPointerEvent) => {
				if (e.button !== 0 && e.button !== 2) return

				discard()
				e.currentTarget.setPointerCapture(e.pointerId)
				paint.begin(pointOf(e, zoom), modifiersOf(e))
			},
			onPointerMove: (e: CanvasPointerEvent) => {
				const points = coalescedPoints(e, zoom)
				const at = points[points.length - 1] ?? null
				reportCursor(at)
				paint.hover(at, paneOffset(e, paneRef))
				if (!paint.isDrawing) return

				const held = batch.current
				held.points.push(...points)
				held.mods = modifiersOf(e)
				if (held.frame === null) held.frame = requestAnimationFrame(draw)
			},
			onPointerUp: (e: CanvasPointerEvent) => {
				// what is still buffered belongs to this stroke, not to the frame
				// that would land after it ends
				discardFrame(batch.current)
				draw()
				paint.end(pointOf(e, zoom), modifiersOf(e))
			},
			onPointerCancel: () => {
				discard()
				paint.cancel()
			},
			onPointerLeave: () => {
				paint.hover(null, null)
				if (!paint.isDrawing) reportCursor(null)
			},
			// right-drag paints colour 2, which the context menu would interrupt
			onContextMenu: (e: CanvasPointerEvent) => e.preventDefault(),
		}
	}, [zoom, paneRef])
}

function discardFrame(held: PointerBatch): void {
	if (held.frame !== null) cancelAnimationFrame(held.frame)
	held.frame = null
}

/**
 * scrolls the clicked pixel to the middle after the magnifier changes zoom.
 * a layout effect, because doing it after paint shows the old corner first.
 */
export function useZoomFocus(focus: ZoomFocus | null) {
	const viewportRef = useRef<HTMLDivElement>(null)

	useLayoutEffect(() => {
		const el = viewportRef.current
		if (!el || !focus) return

		el.scrollLeft = focus.x * focus.zoom + CANVAS_MARGIN - el.clientWidth / 2
		el.scrollTop = focus.y * focus.zoom + CANVAS_MARGIN - el.clientHeight / 2
	}, [focus])

	return viewportRef
}

/** guidance one tool drew must not outlive the switch to another. */
export function useOverlayReset(tool: ToolId) {
	useEffect(() => paint.clearOverlay(), [tool])
}

/**
 * tells the engine which corner is in view, straight from the scroll event.
 * a dispatch here would re-render the app as thickly as a pointer move does.
 */
export function useVisibleOrigin(zoom: number) {
	return useCallback(
		(e: UIEvent<HTMLDivElement>) => {
			const el = e.currentTarget
			reportVisibleOrigin(visiblePixel(el.scrollLeft, el.scrollTop, zoom))
		},
		[zoom],
	)
}

/**
 * holds what is typed in the text box and hands it to the engine, which keeps
 * it until something bakes it. the box follows the text down as it grows.
 */
export function useTextBox(zoom: number) {
	const ref = useRef<HTMLTextAreaElement>(null)
	const [value, setValue] = useState("")

	const onChange = useCallback(
		(e: ChangeEvent<HTMLTextAreaElement>) => {
			setValue(e.target.value)
			paint.setTextValue(e.target.value)

			// scrollHeight is screen pixels and the box is image ones
			const el = ref.current
			if (el) {
				paint.growTextBox(Math.ceil(el.scrollHeight / zoom) + TEXT_PADDING * 2)
			}
		},
		[zoom],
	)

	return { ref, value, onChange }
}

/**
 * drags the open text box by the band around it. the engine takes the new
 * corner straight: one dispatch per pointer move would re-render the app.
 */
export function useTextBoxDrag(box: Rect, zoom: number) {
	const session = useRef<TextDragSession | null>(null)

	const onPointerDown = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			// a click on the text itself belongs to the textarea, not to the band
			if (e.target !== e.currentTarget || e.button !== 0) return

			// keeps the caret in the textarea while the border is dragged
			e.preventDefault()
			session.current = {
				pointerId: e.pointerId,
				start: { x: e.clientX, y: e.clientY },
				origin: { x: box.x, y: box.y },
			}
			e.currentTarget.setPointerCapture(e.pointerId)
		},
		[box.x, box.y],
	)

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLDivElement>) => {
			const drag = session.current
			if (!drag || drag.pointerId !== e.pointerId) return

			paint.moveTextBox(
				drag.origin.x + (e.clientX - drag.start.x) / zoom,
				drag.origin.y + (e.clientY - drag.start.y) / zoom,
			)
		},
		[zoom],
	)

	const onPointerUp = useCallback((e: PointerEvent<HTMLDivElement>) => {
		if (session.current?.pointerId === e.pointerId) session.current = null
	}, [])

	return {
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onPointerCancel: onPointerUp,
	}
}

/** pointer position in the overlay's own css pixels. */
function paneOffset(
	e: CanvasPointerEvent,
	paneRef: RefObject<HTMLDivElement>,
): Point | null {
	const pane = paneRef.current?.getBoundingClientRect()
	return pane ? { x: e.clientX - pane.left, y: e.clientY - pane.top } : null
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

	return events.map(ev => screenToImage(ev.clientX, ev.clientY, rect, zoom))
}

function modifiersOf(e: CanvasPointerEvent): Modifiers {
	return {
		secondary: isSecondaryButton(e.button, e.ctrlKey),
		shift: e.shiftKey,
		alt: e.altKey,
		ctrl: e.ctrlKey,
	}
}

/**
 * marching ants and the handles of an unfinished shape, live from the engine:
 * a drag has to redraw them without dispatching on every pointer move.
 */
export function useOverlayState(): OverlayState {
	return useSyncExternalStore(subscribeOverlay, getOverlayState)
}
