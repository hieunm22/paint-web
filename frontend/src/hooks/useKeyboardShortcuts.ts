import { useEffect } from "react"
import { isPrimaryModifier } from "common/platform"
import { paint } from "engine/PaintEngine"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { stepSize } from "store/slices/toolSlice"
import { toggleView, zoomIn, zoomOut } from "store/slices/viewSlice"

const EDITABLE = ["INPUT", "TEXTAREA", "SELECT"]

/** a shortcut must not fire while the user is typing into a field. */
function isTyping(target: EventTarget | null): boolean {
	const el = target as HTMLElement | null
	if (!el) return false

	return EDITABLE.includes(el.tagName) || el.isContentEditable
}

/**
 * Paint's keys. undo, redo, zoom and the four brush sizes take Cmd on macOS,
 * while the keys Paint alone owns keep Ctrl on every platform.
 */
export function useKeyboardShortcuts() {
	const dispatch = useAppDispatch()
	const zoom = useAppSelector((s) => s.view.zoom)

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isTyping(e.target) || e.altKey) return

			if (isPrimaryModifier(e)) {
				switch (e.key) {
					case "z":
					case "Z":
						e.preventDefault()
						if (e.shiftKey) paint.redo()
						else paint.undo()
						return
					case "y":
					case "Y":
						e.preventDefault()
						paint.redo()
						return
					case "=":
					case "+":
						e.preventDefault()
						dispatch(stepSize(1))
						return
					case "-":
					case "_":
						e.preventDefault()
						dispatch(stepSize(-1))
						return
					case "PageUp":
						e.preventDefault()
						dispatch(zoomIn())
						return
					case "PageDown":
						e.preventDefault()
						dispatch(zoomOut())
						return
				}
			}

			// rulers need zoom >= 1 and gridlines zoom >= 4, as in the ribbon
			if (e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (e.key === "r" && zoom >= 1) {
					e.preventDefault()
					dispatch(toggleView("showRuler"))
				} else if (e.key === "g" && zoom >= 4) {
					e.preventDefault()
					dispatch(toggleView("showGrid"))
				}
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [dispatch, zoom])
}
