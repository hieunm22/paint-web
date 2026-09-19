import { useEffect } from "react"
import { useAppDispatch } from "store/hooks"
import { dismissToast } from "store/slices/uiSlice"

/** how long a notice stays up before it clears itself. */
const LINGER = 6000

/** the same key twice in a row restarts the clock, which re-renders the notice. */
export function useToastTimeout(toast: string | null): void {
	const dispatch = useAppDispatch()

	useEffect(() => {
		if (!toast) return

		const timer = window.setTimeout(() => dispatch(dismissToast()), LINGER)
		return () => window.clearTimeout(timer)
	}, [toast, dispatch])
}
