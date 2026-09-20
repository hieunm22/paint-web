import {
	useCallback,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react"
import { DEFAULT_QUALITY } from "./constant"
import { stemOf } from "common/format"
import { documentName } from "store/common"
import {
	clampDragOffset,
	clampScale,
	clampSkew,
	linkedValue,
	scaleOf,
	wholeOf,
} from "./common"
import { paint } from "engine/PaintEngine"
import { useAppDispatch } from "store/hooks"
import { closeDialog } from "store/slices/uiSlice"
import type { Size } from "types/engine.types"
import type { ImageFormat } from "types/store.types"
import type {
	DragSession,
	Point,
	ResizeSkewForm,
	ResizeUnit,
	SaveAsForm,
} from "./types"

const NO_OFFSET: Point = { x: 0, y: 0 }

/**
 * lets a dialog be dragged by its title bar. offset is a transform delta, leaving
 * the overlay free to center the dialog on open with nothing measured first.
 */
export function useDialogDrag() {
	const dialogRef = useRef<HTMLDivElement>(null)
	const session = useRef<DragSession | null>(null)
	const [offset, setOffset] = useState<Point>(NO_OFFSET)

	const onPointerDown = useCallback(
		(e: ReactPointerEvent<HTMLDivElement>) => {
			const dialog = dialogRef.current
			// ignore secondary buttons, and let the close button keep its click
			if (
				!dialog ||
				e.button !== 0 ||
				(e.target as HTMLElement).closest("button")
			)
				return

			const rect = dialog.getBoundingClientRect()
			session.current = {
				pointerId: e.pointerId,
				start: { x: e.clientX, y: e.clientY },
				origin: offset,
				base: {
					left: rect.left - offset.x,
					top: rect.top - offset.y,
					width: rect.width,
					height: rect.height,
				},
			}
			e.currentTarget.setPointerCapture(e.pointerId)
		},
		[offset],
	)

	const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
		const drag = session.current
		if (!drag || drag.pointerId !== e.pointerId) return

		const raw = {
			x: drag.origin.x + (e.clientX - drag.start.x),
			y: drag.origin.y + (e.clientY - drag.start.y),
		}
		setOffset(
			clampDragOffset(raw, drag.base, {
				width: window.innerWidth,
				height: window.innerHeight,
			}),
		)
	}, [])

	const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
		if (session.current?.pointerId === e.pointerId) session.current = null
	}, [])

	return {
		dialogRef,
		offset,
		handleProps: {
			onPointerDown,
			onPointerMove,
			onPointerUp,
			onPointerCancel: onPointerUp,
		},
	}
}

/** holds the Save As fields; the picker only sees them once OK is pressed. */
export function useSaveAsForm(
	fileName: string,
	initialFormat: ImageFormat,
): SaveAsForm {
	const [name, setName] = useState(() => stemOf(documentName(fileName)))
	const [format, setFormat] = useState(initialFormat)
	const [quality, setQuality] = useState(DEFAULT_QUALITY)

	return { name, format, quality, setName, setFormat, setQuality }
}

/**
 * holds Resize and Skew. `size` is what the numbers describe, which is the
 * selection when one is up and the whole picture when none is.
 */
export function useResizeSkewForm(size: Size): ResizeSkewForm {
	const dispatch = useAppDispatch()
	const [unit, setUnitState] = useState<ResizeUnit>("percent")
	const [ratio, setRatio] = useState(true)
	const [horizontal, setH] = useState(() => wholeOf("percent", size.width))
	const [vertical, setV] = useState(() => wholeOf("percent", size.height))
	const [skewH, setSkewH] = useState(0)
	const [skewV, setSkewV] = useState(0)

	/** switching unit restates the same size rather than keeping the digits. */
	const setUnit = (next: ResizeUnit) => {
		if (next === unit) return

		const scaleX = scaleOf(unit, horizontal, size.width)
		const scaleY = scaleOf(unit, vertical, size.height)
		setUnitState(next)
		setH(Math.round(wholeOf(next, size.width) * scaleX))
		setV(Math.round(wholeOf(next, size.height) * scaleY))
	}

	return {
		unit,
		horizontal,
		vertical,
		ratio,
		skewH,
		skewV,
		setUnit,
		setRatio,
		setSkewH: value => setSkewH(clampSkew(value)),
		setSkewV: value => setSkewV(clampSkew(value)),

		setHorizontal: value => {
			setH(value)
			if (ratio) setV(linkedValue(unit, value, size.width, size.height))
		},

		setVertical: value => {
			setV(value)
			if (ratio) setH(linkedValue(unit, value, size.height, size.width))
		},

		apply: () => {
			paint.transform({
				scaleX: clampScale(scaleOf(unit, horizontal, size.width), size.width),
				scaleY: clampScale(scaleOf(unit, vertical, size.height), size.height),
				skewH: clampSkew(skewH),
				skewV: clampSkew(skewV),
			})
			dispatch(closeDialog())
		},
	}
}
