import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { QAT_ITEMS } from "./constant"
import { paint } from "engine/PaintEngine"
import { useFileCommands } from "hooks/useFileCommands"
import { tooltipWithShortcut } from "locales/common"
import { useAppSelector } from "store/hooks"
import type { QatItem, QatItemId } from "./types"

/** Undo and Redo follow the engine's stacks; Save is always available. */
export function useQatItems(): QatItem[] {
	const { i18n } = useTranslation()
	const canUndo = useAppSelector((s) => s.history.canUndo)
	const canRedo = useAppSelector((s) => s.history.canRedo)
	const files = useFileCommands()

	return useMemo(() => {
		const enabled: Record<QatItemId, boolean> = {
			save: true,
			undo: canUndo,
			redo: canRedo,
		}
		const handlers: Record<QatItemId, (() => void) | undefined> = {
			save: () => void files.save(),
			undo: () => paint.undo(),
			redo: () => paint.redo(),
		}

		return QAT_ITEMS.map((item) => ({
			...item,
			title: tooltipWithShortcut(item.labelKey, item.shortcutKey),
			disabled: !enabled[item.id],
			onClick: handlers[item.id],
		}))
	}, [canUndo, canRedo, i18n.language, files])
}
