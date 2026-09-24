import { useEffect } from "react"
import { NUDGE_KEYS } from "common/constant"
import { isTypingTarget, reachesCanvas } from "common/dom"
import {
	isFullScreenKey,
	isPrimaryModifier,
	isReservedCtrlKey,
	isZoomKey,
} from "common/platform"
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
			if (e.defaultPrevented) return
			if (isTypingTarget(e.target) && !reachesCanvas(e)) return

			// windows browsers keep Ctrl+N, Ctrl+W, Ctrl+R and Ctrl+PageUp, so
			// Paint answers all four with Alt held as well
			if (isReservedCtrlKey(e, "n")) {
				e.preventDefault()
				files.newDocument()
				return
			}

			if (isReservedCtrlKey(e, "w")) {
				e.preventDefault()
				dispatch(openDialog("resize-skew"))
				return
			}

			// rulers need zoom >= 1, as in the ribbon
			if (isReservedCtrlKey(e, "r") && zoom >= 1) {
				e.preventDefault()
				dispatch(toggleView("showRuler"))
				return
			}

			if (isZoomKey(e)) {
				e.preventDefault()
				dispatch(e.key === "PageUp" ? zoomIn() : zoomOut())
				return
			}

			if (isFullScreenKey(e)) {
				e.preventDefault()
				dispatch(toggleView("fullScreen"))
				return
			}

			// the ribbon's own arrow keys walk the toolbar and stop here
			if (e.altKey) return

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
			}

			const nudge = NUDGE_KEYS[e.key]
			if (nudge) {
				e.preventDefault()
				paint.nudgeSelection(nudge.x, nudge.y)
				return
			}

			switch (e.key) {
				case "Delete":
				case "Backspace":
					e.preventDefault()
					paint.deleteSelection()
					return
				case "Escape":
					// full screen goes first: it is the newest thing on the screen
					if (fullScreen)
						dispatch(toggleView("fullScreen"))
					else if (!paint.deselect())
						paint.discardHeld()
					return
				case "Enter":
					paint.commitHeld()
					return
			}

			if (e.ctrlKey && !e.metaKey && !e.shiftKey) {
				if (e.key === "e") {
					e.preventDefault()
					dispatch(openDialog("image-properties"))
				} else if (e.key === "g") {
					e.preventDefault()
					dispatch(toggleView("showGrid"))
				}
			}
		}

		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [dispatch, zoom, fullScreen, files])
}
