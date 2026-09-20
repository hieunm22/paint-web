import { useEffect, useState } from "react"
import { listRecents } from "common/recents"
import { useAppSelector } from "store/hooks"
import type { RecentEntry } from "types/common.types"

/**
 * the recents list out of IndexedDB. the document name is the trigger: it
 * changes on every open and every save, which is exactly when a row appears.
 */
export function useRecents(): RecentEntry[] {
	const [entries, setEntries] = useState<RecentEntry[]>([])
	const fileName = useAppSelector((s) => s.doc.fileName)

	useEffect(() => {
		let live = true
		void listRecents().then((rows) => {
			if (live) setEntries(rows)
		})
		return () => {
			live = false
		}
	}, [fileName])

	return entries
}
