import { useEffect } from "react"
import { useAppSelector } from "store/hooks"

/** the browser's own leave-site prompt, armed only while work is unsaved. */
export function useBeforeUnload(): void {
	const isDirty = useAppSelector(s => s.doc.isDirty)

	useEffect(() => {
		if (!isDirty) return

		const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
		window.addEventListener("beforeunload", onBeforeUnload)
		return () => window.removeEventListener("beforeunload", onBeforeUnload)
	}, [isDirty])
}
