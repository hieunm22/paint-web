import { useEffect } from "react"
import { NUDGE_KEYS } from "common/constant"
import { isTypingTarget, reachesCanvas } from "common/dom"
import { isPrimaryModifier } from "common/platform"
import { paint } from "engine/PaintEngine"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { stepSize } from "store/slices/toolSlice"
import { openDialog } from "store/slices/uiSlice"
import { toggleView, zoomIn, zoomOut } from "store/slices/viewSlice"

/**
 * Paint's keys. undo, redo, zoom, the file commands and the four brush sizes
 * take Cmd on macOS, while the keys Paint alone owns keep Ctrl everywhere.
 */
export function useKeyboardShortcuts() {
	const dispatch = useAppDispatch()
	const zoom = useAppSelector(s => s.view.zoom)
	const fullScreen = useAppSelector(s => s.view.fullScreen)
	const files = useFileCommands()

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			// the ribbon's own arrow keys walk the toolbar and stop here
			if (e.altKey || e.defaultPrevented) return
			if (isTypingTarget(e.target) && !reachesCanvas(e)) return

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
					case "p":
						e.preventDefault()
						void files.print()
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
					case "a":
						e.preventDefault()
						paint.selectAll()
						return
					case "i":
						e.preventDefault()
						paint.invertSelection()
						return
					case "x":
						e.preventDefault()
						void files.cutSelection()
						return
					case "c":
						e.preventDefault()
						void files.copySelection()
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

			const nudge = NUDGE_KEYS[e.key]
			if (nudge) {
				e.preventDefault()
				paint.nudgeSelection(nudge.x, nudge.y)
				return
			}

			switch (e.key) {
				case "F11":
					e.preventDefault()
					dispatch(toggleView("fullScreen"))
					return
				case "Delete":
				case "Backspace":
					e.preventDefault()
					paint.deleteSelection()
					return
				case "Escape":
					// full screen goes first: it is the newest thing on the screen
					if (fullScreen) dispatch(toggleView("fullScreen"))
					else paint.discardHeld()
					return
				case "Enter":
					paint.commitHeld()
					return
			}

			// rulers need zoom >= 1 and gridlines zoom >= 4, as in the ribbon
			if (e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (e.key === "e") {
					e.preventDefault()
					dispatch(openDialog("image-properties"))
				} else if (e.key === "w") {
					e.preventDefault()
					dispatch(openDialog("resize-skew"))
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
	}, [dispatch, zoom, fullScreen, files])
}
