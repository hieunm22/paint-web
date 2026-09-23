import {
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react"
import { SUBMENU_HOVER_DELAY } from "./constant"
import { forgetRecent, listRecents } from "common/recents"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { closeMenu, showMenu } from "store/slices/uiSlice"
import type { EmptyVoid, RecentEntry } from "types/common.types"
import type { RecentsState, SubmenuHover } from "./types"

/**
 * the recents list out of IndexedDB. the document name is the trigger: it
 * changes on every open and every save, which is exactly when a row appears.
 */
export function useRecents(): RecentsState {
	const [entries, setEntries] = useState<RecentEntry[]>([])
	const fileName = useAppSelector(s => s.doc.fileName)

	useEffect(() => {
		let live = true
		void listRecents().then(rows => {
			if (live) setEntries(rows)
		})
		return () => {
			live = false
		}
	}, [fileName])

	const forget = useCallback(async (name: string) => {
		await forgetRecent(name)
		setEntries(rows => rows.filter(row => row.name !== name))
	}, [])

	return { entries, forget }
}

export function useSubmenuHover(
	menuId: string | undefined,
	onClick: EmptyVoid,
): SubmenuHover {
	const dispatch = useAppDispatch()
	const timer = useRef(0)

	const cancel = useCallback(() => window.clearTimeout(timer.current), [])

	useEffect(() => cancel, [cancel])

	const rest = useCallback(() => {
		cancel()
		timer.current = window.setTimeout(() => {
			dispatch(menuId ? showMenu(menuId) : closeMenu())
		}, SUBMENU_HOVER_DELAY)
	}, [cancel, dispatch, menuId])

	const pick = useCallback(() => {
		cancel()
		onClick()
	}, [cancel, onClick])

	return { onClick: pick, onMouseEnter: rest, onMouseLeave: cancel }
}
