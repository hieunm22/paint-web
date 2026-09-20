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
} from "react"
import { HAS_RAW_POINTER, TEXT_PADDING } from "common/constant"
import {
	CANVAS_MARGIN,
	THUMBNAIL_BOX,
	THUMBNAIL_FRAME,
	THUMBNAIL_INTERVAL_MS,
} from "./constant"
import { isSecondaryButton } from "common/platform"
import { writePageSize } from "store/common"
import {
	boxToThumb,
	fittedBox,
	resizedDocument,
	screenToImage,
	thumbToImage,
	visibleRect,
} from "./common"
import { reportCursor } from "engine/cursor"
import { getOverlayState, subscribeOverlay } from "engine/overlay"
import { paint } from "engine/PaintEngine"
import { penPressure, penTilt, smoothPressure } from "engine/pressure"
import type {
	Modifiers,
	OverlayState,
	Size,
	StrokePoint,
} from "types/engine.types"
import type {
	Point,
	Rect,
	ToolId,
	ZoomFocus,
} from "types/store.types"
import type {
	HandlePosition,
	NativePointer,
	PointerBatch,
	ResizeSession,
	TextDragSession,
} from "./types"

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
 * drives the engine straight from the pointer, dispatching nothing: a move
 * must not re-render the app. memoised to keep one handler identity.
 */
export function usePointerTools(
	zoom: number,
	paneRef: RefObject<HTMLDivElement>,
	previewRef: RefObject<HTMLCanvasElement>,
) {
	const batch = useRef<PointerBatch>({
		points: [],
		mods: { secondary: false, shift: false, alt: false, ctrl: false },
		frame: null,
		pointerId: null,
		penActive: false,
		pressure: null,
		rect: null,
	})

	const tools = useMemo(() => {
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
			held.pointerId = null
			held.pressure = null
			held.rect = null
		}

		/** the positions of one event, queued for the frame that draws them. */
		const sample = (e: NativePointer, rect: DOMRect) => {
			const held = batch.current
			const points = coalescedPoints(e, rect, zoom, held)
			held.points.push(...points)
			held.mods = modifiersOf(e)
			if (held.frame === null) held.frame = requestAnimationFrame(draw)
		}

		/** a palm on the tablet is a touch beside a pen, and draws nothing. */
		const rejected = (e: NativePointer | CanvasPointerEvent) =>
			batch.current.penActive && e.pointerType === "touch"

		/** an event from a finger that joined a gesture another pointer owns. */
		const foreign = (e: CanvasPointerEvent) =>
			batch.current.pointerId !== null &&
			batch.current.pointerId !== e.pointerId

		return {
			/** chromium reports between frames, ahead of the next pointermove. */
			raw: (e: NativePointer) => {
				const held = batch.current
				const rect = held.rect
				if (
					!rect ||
					!paint.isDrawing ||
					rejected(e) ||
					held.pointerId !== e.pointerId
				) {
					return
				}

				sample(e, rect)
			},

			props: {
				onPointerDown: (e: CanvasPointerEvent) => {
					if ((e.button !== 0 && e.button !== 2) || rejected(e)) return

					discard()
					const held = batch.current
					held.pointerId = e.pointerId
					held.penActive = e.pointerType === "pen"
					// measured once: a raw listener firing at 1000 hz must not
					// ask the layout where the canvas is on every sample
					held.rect = e.currentTarget.getBoundingClientRect()
					e.currentTarget.setPointerCapture(e.pointerId)
					paint.begin(pointOf(e, zoom, held), modifiersOf(e))
				},
				onPointerMove: (e: CanvasPointerEvent) => {
					if (rejected(e)) return

					const held = batch.current
					const rect = e.currentTarget.getBoundingClientRect()
					const drawing = paint.isDrawing && !foreign(e)
					// a raw listener has already queued these positions
					const points =
						drawing && HAS_RAW_POINTER
							? []
							: coalescedPoints(e.nativeEvent, rect, zoom, held)
					// a plain position for the hover: folding this sample into the
					// pressure filter as well would count it twice
					const at =
						points[points.length - 1] ??
						screenToImage(e.clientX, e.clientY, rect, zoom)
					reportCursor(at)
					paint.hover(at, paneOffset(e, paneRef))
					if (!drawing || !points.length) return

					held.points.push(...points)
					held.mods = modifiersOf(e)
					if (held.frame === null) held.frame = requestAnimationFrame(draw)
				},
				onPointerUp: (e: CanvasPointerEvent) => {
					if (rejected(e) || foreign(e)) return

					// what is still buffered belongs to this stroke, not to the frame
					// that would land after it ends
					discardFrame(batch.current)
					draw()
					const held = batch.current
					paint.end(pointOf(e, zoom, held), modifiersOf(e))
					held.pointerId = null
					held.penActive = false
					held.pressure = null
					held.rect = null
				},
				onPointerCancel: () => {
					discard()
					batch.current.penActive = false
					paint.cancel()
				},
				onPointerLeave: () => {
					paint.hover(null, null)
					if (!paint.isDrawing) reportCursor(null)
				},
				// right-drag paints colour 2, which the context menu would interrupt
				onContextMenu: (e: CanvasPointerEvent) => e.preventDefault(),
			},
		}
	}, [zoom, paneRef, previewRef])

	useEffect(() => {
		const canvas = previewRef.current
		if (!canvas || !HAS_RAW_POINTER) return

		const onRaw = (e: Event) => tools.raw(e as NativePointer)
		canvas.addEventListener("pointerrawupdate", onRaw)
		return () => canvas.removeEventListener("pointerrawupdate", onRaw)
	}, [tools, previewRef])

	return tools.props
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

/**
 * drags the paper's edge. the outline follows the pointer through the dom and
 * only the lift reaches the engine: a size per move would redraw the app.
 */
export function useDocumentResize(doc: Size, zoom: number) {
	const previewRef = useRef<HTMLDivElement>(null)
	const session = useRef<ResizeSession | null>(null)

	const show = useCallback(
		(size: Size | null) => {
			const el = previewRef.current
			if (!el) return

			el.style.display = size ? "block" : "none"
			if (!size) return

			el.style.width = `${size.width * zoom}px`
			el.style.height = `${size.height * zoom}px`
		},
		[zoom],
	)

	const onPointerDown = useCallback(
		(handle: HandlePosition) => (e: PointerEvent<HTMLElement>) => {
			if (e.button !== 0) return

			e.currentTarget.setPointerCapture(e.pointerId)
			session.current = {
				pointerId: e.pointerId,
				handle,
				start: { x: e.clientX, y: e.clientY },
				size: doc,
			}
			show(doc)
		},
		[doc, show],
	)

	const onPointerMove = useCallback(
		(e: PointerEvent<HTMLElement>) => {
			const drag = session.current
			if (!drag || drag.pointerId !== e.pointerId) return

			drag.size = resizedDocument(drag.handle, doc, {
				x: (e.clientX - drag.start.x) / zoom,
				y: (e.clientY - drag.start.y) / zoom,
			})
			show(drag.size)
		},
		[doc, zoom, show],
	)

	const onPointerUp = useCallback(
		(e: PointerEvent<HTMLElement>) => {
			const drag = session.current
			if (!drag || drag.pointerId !== e.pointerId) return

			session.current = null
			show(null)
			paint.resizeCanvas(drag.size)
			// the size the user chose by hand outlives the document
			writePageSize(drag.size)
		},
		[show],
	)

	return {
		previewRef,
		handleProps: (handle: HandlePosition) => ({
			onPointerDown: onPointerDown(handle),
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
		}),
	}
}

/**
 * keeps the thumbnail painted and lets its frame scroll the viewport. neither
 * the timer nor a drag goes through react.
 */
export function useThumbnail(
	zoom: number,
	scrollRef: RefObject<HTMLDivElement>,
) {
	const ref = useRef<HTMLCanvasElement>(null)

	useEffect(() => {
		const timer = setInterval(() => {
			const target = ref.current?.getContext("2d")
			const scroller = scrollRef.current
			if (target && scroller) drawThumbnail(target, scroller, zoom)
		}, THUMBNAIL_INTERVAL_MS)

		return () => clearInterval(timer)
	}, [zoom, scrollRef])

	const scrollTo = useCallback(
		(e: PointerEvent<HTMLCanvasElement>) => {
			const scroller = scrollRef.current
			const fit = fittedBox(paint.surface.documentSize, THUMBNAIL_BOX)
			if (!scroller || !fit) return

			const box = e.currentTarget.getBoundingClientRect()
			const at = thumbToImage(
				{ x: e.clientX - box.left, y: e.clientY - box.top },
				paint.surface.documentSize,
				fit,
			)
			scroller.scrollLeft =
				at.x * zoom + CANVAS_MARGIN - scroller.clientWidth / 2
			scroller.scrollTop =
				at.y * zoom + CANVAS_MARGIN - scroller.clientHeight / 2
		},
		[zoom, scrollRef],
	)

	return {
		ref,
		onPointerDown: (e: PointerEvent<HTMLCanvasElement>) => {
			e.currentTarget.setPointerCapture(e.pointerId)
			scrollTo(e)
		},
		onPointerMove: (e: PointerEvent<HTMLCanvasElement>) => {
			if (e.buttons) scrollTo(e)
		},
	}
}

/** the picture scaled into the box, with the viewed part framed in red. */
function drawThumbnail(
	target: CanvasRenderingContext2D,
	scroller: HTMLDivElement,
	zoom: number,
): void {
	const doc = paint.surface.documentSize
	const fit = fittedBox(doc, THUMBNAIL_BOX)
	target.clearRect(0, 0, THUMBNAIL_BOX.width, THUMBNAIL_BOX.height)
	if (!fit) return

	paint.surface.drawInto(target, fit)

	const view = boxToThumb(
		visibleRect(
			{ x: scroller.scrollLeft, y: scroller.scrollTop },
			{ width: scroller.clientWidth, height: scroller.clientHeight },
			zoom,
		),
		doc,
		fit,
	)
	target.save()
	target.strokeStyle = THUMBNAIL_FRAME
	target.lineWidth = 1
	target.strokeRect(
		Math.round(view.x) + 0.5,
		Math.round(view.y) + 0.5,
		Math.round(Math.min(view.w, fit.w)),
		Math.round(Math.min(view.h, fit.h)),
	)
	target.restore()
}

/** pointer position in the overlay's own css pixels. */
function paneOffset(
	e: CanvasPointerEvent,
	paneRef: RefObject<HTMLDivElement>,
): Point | null {
	const pane = paneRef.current?.getBoundingClientRect()
	return pane ? { x: e.clientX - pane.left, y: e.clientY - pane.top } : null
}

/**
 * one position with what the pen reported about the touch. the smoothed force
 * is carried on the batch: a filter needs the sample before this one.
 */
function strokePoint(
	e: NativePointer,
	rect: DOMRect,
	zoom: number,
	held: PointerBatch,
): StrokePoint {
	held.pressure = smoothPressure(
		held.pressure,
		penPressure(e.pointerType, e.pressure),
	)

	return {
		...screenToImage(e.clientX, e.clientY, rect, zoom),
		pressure: held.pressure,
		tilt: penTilt(e.pointerType, e.tiltX, e.tiltY),
	}
}

function pointOf(
	e: CanvasPointerEvent,
	zoom: number,
	held: PointerBatch,
): StrokePoint {
	const rect = e.currentTarget.getBoundingClientRect()
	return strokePoint(e.nativeEvent, rect, zoom, held)
}

/**
 * a pen fires far faster than the display refreshes; the browser holds the
 * intermediate positions back and hands them over with the event.
 */
function coalescedPoints(
	e: NativePointer,
	rect: DOMRect,
	zoom: number,
	held: PointerBatch,
): StrokePoint[] {
	const batch = e.getCoalescedEvents?.() ?? []
	const events = batch.length ? batch : [e]

	return events.map(ev => strokePoint(ev, rect, zoom, held))
}

function modifiersOf(e: NativePointer | CanvasPointerEvent): Modifiers {
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
