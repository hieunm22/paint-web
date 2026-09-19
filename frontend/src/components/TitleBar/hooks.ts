import { useMemo } from "react"
import { paint } from "engine/PaintEngine"
import { useAppSelector } from "store/hooks"
import type { QatItem, QatItemId } from "./types"
import { QAT_ITEMS } from "./constant"

/** Undo and Redo follow the engine's stacks; Save waits for the file phase. */
export function useQatItems(): QatItem[] {
	const canUndo = useAppSelector((s) => s.history.canUndo)
	const canRedo = useAppSelector((s) => s.history.canRedo)

	return useMemo(() => {
		const enabled: Record<QatItemId, boolean> = {
			save: false,
			undo: canUndo,
			redo: canRedo,
		}
		const handlers: Record<QatItemId, (() => void) | undefined> = {
			save: undefined,
			undo: () => paint.undo(),
			redo: () => paint.redo(),
		}

		return QAT_ITEMS.map((item) => ({
			...item,
			disabled: !enabled[item.id],
			onClick: handlers[item.id],
		}))
	}, [canUndo, canRedo])
}
