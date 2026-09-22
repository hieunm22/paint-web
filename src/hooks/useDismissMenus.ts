import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { closeBackstage, closeMenu } from "store/slices/uiSlice"

/** closes the open ribbon menu on an outside click or Escape. */
export function useDismissMenus() {
	const dispatch = useAppDispatch()
	const openMenu = useAppSelector(s => s.ui.openMenu)
	const backstageOpen = useAppSelector(s => s.ui.backstageOpen)

	useEffect(() => {
		if (!openMenu) return

		// the button that opened the menu is the one Escape hands focus back to
		const opener = document.activeElement as HTMLElement | null

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest("[data-menu-root]")) dispatch(closeMenu())
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return

			e.stopPropagation()
			dispatch(closeMenu())
			opener?.focus()
		}

		// runs before the opener's onClick to prevent the menu from closing then reopening.
		document.addEventListener("pointerdown", onPointerDown)
		document.addEventListener("keydown", onKeyDown)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown)
			document.removeEventListener("keydown", onKeyDown)
		}
	}, [openMenu, dispatch])

	useEffect(() => {
		if (!backstageOpen) return

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement
			if (target.closest(".file-menu, .ribbon__tab--file")) return

			dispatch(closeBackstage())
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return

			e.stopPropagation()
			dispatch(closeBackstage())
		}

		document.addEventListener("pointerdown", onPointerDown)
		document.addEventListener("keydown", onKeyDown)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown)
			document.removeEventListener("keydown", onKeyDown)
		}
	}, [backstageOpen, dispatch])
}
