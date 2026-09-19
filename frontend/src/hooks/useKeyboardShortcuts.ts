import { useEffect } from "react"
import { isTypingTarget } from "common/dom"
import { isPrimaryModifier } from "common/platform"
import { paint } from "engine/PaintEngine"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { stepSize } from "store/slices/toolSlice"
import { openDialog } from "store/slices/uiSlice"
import { toggleView, zoomIn, zoomOut } from "store/slices/viewSlice"
import { useFileCommands } from "./useFileCommands"

/**
 * Paint's keys. undo, redo, zoom, the file commands and the four brush sizes
 * take Cmd on macOS, while the keys Paint alone owns keep Ctrl everywhere.
 */
export function useKeyboardShortcuts() {
	const dispatch = useAppDispatch()
	const zoom = useAppSelector((s) => s.view.zoom)
	const files = useFileCommands()

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isTypingTarget(e.target) || e.altKey) return

			if (isPrimaryModifier(e)) {
				switch (e.key.toLowerCase()) {
					case "z":
						e.preventDefault()
						if (e.shiftKey) paint.redo()
						else paint.undo()
						return
					case "y":
						e.preventDefault()
						paint.redo()
						return
					case "n":
						e.preventDefault()
						files.newDocument()
						return
					case "o":
						e.preventDefault()
						void files.openDocument()
						return
					case "s":
						e.preventDefault()
						if (e.shiftKey) dispatch(openDialog("save-as"))
						else void files.save()
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
				}

				switch (e.key) {
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
				if (e.key === "e") {
					e.preventDefault()
					dispatch(openDialog("image-properties"))
				} else if (e.key === "r" && zoom >= 1) {
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
	}, [dispatch, zoom, files])
}
