import { useCallback, useEffect, useState } from "react"
import { forgetRecent, listRecents } from "common/recents"
import { useAppSelector } from "store/hooks"
import type { RecentEntry } from "types/common.types"
import type { RecentsState } from "./types"

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
