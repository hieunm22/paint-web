import { useSyncExternalStore } from "react"
import { getCursor, subscribeCursor } from "engine/cursor"

/** live pointer position, subscribed outside redux to limit re-renders to this cell. */
export function useCursorPosition() {
	return useSyncExternalStore(subscribeCursor, getCursor)
}
