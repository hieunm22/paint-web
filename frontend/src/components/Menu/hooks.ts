import {
	createContext,
	useCallback,
	useContext,
	useLayoutEffect,
	useState,
	type MouseEvent,
	type RefObject,
} from "react"
import { placeMenu } from "./common"
import { useAppDispatch } from "store/hooks"
import { closeMenu } from "store/slices/uiSlice"
import type { MenuPosition } from "./types"

export const MenuAnchorContext = createContext<RefObject<HTMLElement> | null>(
	null,
)

export function useMenuAnchor() {
	return useContext(MenuAnchorContext)
}

/**
 * keeps a portalled menu aligned to its anchor, re-measuring on resize and scroll.
 * returns null on the first pass, before the menu has been measured.
 */
export function useMenuPlacement(
	menuRef: RefObject<HTMLElement>,
): MenuPosition | null {
	const anchorRef = useMenuAnchor()
	const [position, setPosition] = useState<MenuPosition | null>(null)

	useLayoutEffect(() => {
		const anchor = anchorRef?.current
		const menu = menuRef.current
		if (!anchor || !menu) return

		const place = () => {
			const a = anchor.getBoundingClientRect()
			const m = menu.getBoundingClientRect()
			setPosition(
				placeMenu(
					a,
					{ width: m.width, height: m.height },
					{
						width: window.innerWidth,
						height: window.innerHeight,
					},
				),
			)
		}

		place()
		window.addEventListener("resize", place)
		// capture phase lets the menu follow any scrolling ancestor, not just the window
		window.addEventListener("scroll", place, true)

		return () => {
			window.removeEventListener("resize", place)
			window.removeEventListener("scroll", place, true)
		}
	}, [anchorRef, menuRef])

	return position
}

/**
 * a windows menu closes the moment an item is activated. listening on the menu
 * itself covers every cell without each one remembering to dismiss.
 */
export function useMenuDismiss() {
	const dispatch = useAppDispatch()

	return useCallback(
		(e: MouseEvent<HTMLDivElement>) => {
			const target = e.target as HTMLElement
			// a click on the menu's own padding is not a choice; a disabled item
			// fires nothing at all
			if (target.closest("button")) dispatch(closeMenu())
		},
		[dispatch],
	)
}
