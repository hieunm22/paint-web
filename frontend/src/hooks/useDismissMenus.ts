import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "store"
import { closeMenu } from "store/slices/uiSlice"

/** closes the open ribbon menu on an outside click or Escape. */
export function useDismissMenus() {
	const dispatch = useAppDispatch()
	const openMenu = useAppSelector((s) => s.ui.openMenu)

	useEffect(() => {
		if (!openMenu) return

		const onPointerDown = (e: PointerEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest("[data-menu-root]")) dispatch(closeMenu())
		}
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") dispatch(closeMenu())
		}

		// runs before the opener's onClick to prevent the menu from closing then reopening.
		document.addEventListener("pointerdown", onPointerDown)
		document.addEventListener("keydown", onKeyDown)
		return () => {
			document.removeEventListener("pointerdown", onPointerDown)
			document.removeEventListener("keydown", onKeyDown)
		}
	}, [openMenu, dispatch])
}
