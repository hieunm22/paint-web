import {
	useCallback,
	useRef,
	useState,
	type PointerEvent as ReactPointerEvent,
} from "react"
import { clampDragOffset } from "./common"
import type { DragSession, Point } from "./types"

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
