import { useCallback, useEffect, useRef } from "react"
import { paint } from "engine/PaintEngine"
import { useAppDispatch } from "store/hooks"
import { toggleView } from "store/slices/viewSlice"

/**
 * holds the tab in the browser's own full screen for as long as the view is
 * up, and paints the picture into whatever room that leaves.
 */
export function useFullScreen() {
	const dispatch = useAppDispatch()
	const ref = useRef<HTMLCanvasElement>(null)

	const exit = useCallback(() => {
		dispatch(toggleView("fullScreen"))
	}, [dispatch])

	useEffect(() => {
		void document.documentElement.requestFullscreen?.().catch(() => undefined)

		// leaving full screen by Esc or by the browser's own control has to put
		// the picture back in its window as well
		const onChange = () => {
			if (!document.fullscreenElement) exit()
		}
		document.addEventListener("fullscreenchange", onChange)

		return () => {
			document.removeEventListener("fullscreenchange", onChange)
			if (document.fullscreenElement) void document.exitFullscreen()
		}
	}, [exit])

	useEffect(() => {
		const draw = () => {
			const canvas = ref.current
			const target = canvas?.getContext("2d")
			const doc = paint.surface.documentSize
			if (!canvas || !target || !doc.width || !doc.height) return

			const scale = Math.min(
				window.innerWidth / doc.width,
				window.innerHeight / doc.height,
			)
			canvas.width = Math.max(1, Math.round(doc.width * scale))
			canvas.height = Math.max(1, Math.round(doc.height * scale))
			paint.surface.drawInto(target, {
				x: 0,
				y: 0,
				w: canvas.width,
				h: canvas.height,
			})
		}

		draw()
		window.addEventListener("resize", draw)
		return () => window.removeEventListener("resize", draw)
	}, [])

	return { ref, exit }
}
