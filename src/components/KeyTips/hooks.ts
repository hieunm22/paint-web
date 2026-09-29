import { useEffect, useState } from "react"
import {
	currentKeyTips,
	keyTipChar,
	keyTipsFor,
	pressKeyTip,
	topKeyTipMenu,
} from "common/keyTips"
import { useAppDispatch, useAppStore } from "store/hooks"
import { closeBackstage, closeMenu, collapseRibbon } from "store/slices/uiSlice"
import type { EmptyVoid, KeyTipBase, KeyTipTarget } from "types/common.types"

/**
 * Alt pressed and released on its own shows the tips
 */
export function useKeyTips(): KeyTipTarget[] {
	const dispatch = useAppDispatch()
	const store = useAppStore()
	const [shown, setShown] = useState<KeyTipTarget[]>([])

	useEffect(() => {
		// null while no tips are up
		let base: KeyTipBase | null = null
		let typed = ""
		let targets: KeyTipTarget[] = []
		// set on an Alt press, cleared by anything that turns it into a chord
		let armed = false

		// keys pressed while a press is still rendering, played back after it
		let queued: string[] = []
		let settling = false

		// a press only shows its result once react has rendered it
		const afterRender = (run: EmptyVoid) => {
			settling = true
			window.setTimeout(() => {
				settling = false
				run()
				replay()
			}, 0)
		}

		const draw = () => {
			const reachable = keyTipsFor(targets, typed)
			setShown(reachable)
		}

		const leave = () => {
			base = null
			typed = ""
			targets = []
			queued = []
			setShown([])
		}

		const show = () => {
			if (!base) return

			typed = ""
			targets = currentKeyTips(base)
			if (targets.length) draw()
			else leave()
		}

		// a menu that opened takes the tips over; a tab shows its own controls
		const settle = (el: HTMLElement) => {
			if (!base) return

			if (topKeyTipMenu()) {
				show()
			} else if (el.getAttribute("role") === "tab") {
				base = "tab"
				show()
			} else {
				leave()
			}
		}

		const activate = (el: HTMLElement) => {
			targets = []
			setShown([])
			const clicked = pressKeyTip(el)
			if (clicked) afterRender(() => settle(el))
			else leave()
		}

		const type = (ch: string) => {
			const next = typed + ch
			const reachable = keyTipsFor(targets, next)
			// Paint ignores a key no tip starts with
			if (!reachable.length) return

			const hit = reachable.find(target => target.keys === next)
			if (!hit) {
				typed = next
				draw()
				return
			}
			if (!hit.disabled) activate(hit.el)
		}

		const back = () => {
			const { openMenu, backstageOpen, ribbon } = store.getState().ui

			if (topKeyTipMenu()) {
				if (openMenu) dispatch(closeMenu())
				else if (backstageOpen) dispatch(closeBackstage())
				afterRender(show)
				return
			}
			if (base === "tab") {
				if (ribbon === "peek") dispatch(collapseRibbon())
				base = "root"
				afterRender(show)
				return
			}
			leave()
		}

		const respond = (key: string) => {
			if (key === "Escape") {
				back()
			} else if (key === "Backspace") {
				typed = typed.slice(0, -1)
				draw()
			} else {
				type(key)
			}
		}

		const replay = () => {
			while (base && !settling && queued.length) {
				const key = queued.shift()
				if (key) respond(key)
			}
		}

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Alt") {
				if (!e.repeat) armed = !e.ctrlKey && !e.metaKey && !e.shiftKey
				return
			}

			armed = false
			if (!base || e.isComposing) return

			const ch = keyTipChar(e)
			const chord = e.ctrlKey || e.metaKey || e.altKey
			const step = e.key === "Escape" || e.key === "Backspace"
			const tipKey = chord ? null : ch
			const key = step ? e.key : tipKey
			// any other key goes back to ordinary use and still does its job
			if (!key) {
				leave()
				return
			}

			e.preventDefault()
			e.stopPropagation()
			if (settling) queued.push(key)
			else respond(key)
		}

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key !== "Alt" || !armed) return

			armed = false
			// keeps the browser from moving the focus to its own menu bar
			e.preventDefault()
			if (base) {
				leave()
				return
			}

			const { ui, view } = store.getState()
			if (ui.dialog || view.fullScreen) return

			base = "root"
			show()
		}

		const onPointerDown = () => {
			armed = false
			if (base) leave()
		}

		const onBlur = () => {
			armed = false
			leave()
		}

		// capture runs ahead of the app shortcuts and the menus' own Escape
		window.addEventListener("keydown", onKeyDown, true)
		window.addEventListener("keyup", onKeyUp, true)
		window.addEventListener("pointerdown", onPointerDown, true)
		window.addEventListener("blur", onBlur)
		window.addEventListener("resize", show)
		window.addEventListener("scroll", show, true)
		return () => {
			window.removeEventListener("keydown", onKeyDown, true)
			window.removeEventListener("keyup", onKeyUp, true)
			window.removeEventListener("pointerdown", onPointerDown, true)
			window.removeEventListener("blur", onBlur)
			window.removeEventListener("resize", show)
			window.removeEventListener("scroll", show, true)
		}
	}, [dispatch, store])

	return shown
}
