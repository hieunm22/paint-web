import { useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { QAT_ORDER } from "common/constant"
import { QAT_ITEMS } from "./constant"
import { tooltipWithShortcut } from "locales/common"
import { writeQat } from "store/common"
import { paint } from "engine/PaintEngine"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { openDialog } from "store/slices/uiSlice"
import type { EmptyVoid } from "types/common.types"
import type { QatItemId } from "types/store.types"
import type { QatItem } from "./types"

/** the customization outlives the session, which is what localStorage is for. */
export function useQatPersistence(items: QatItemId[]): void {
	useEffect(() => writeQat(items), [items])
}

/**
 * every button the toolbar can show, in its fixed order. Undo and Redo follow
 * the engine's stacks; the file commands are always available.
 */
export function useQatItems(): QatItem[] {
	const { i18n } = useTranslation()
	const dispatch = useAppDispatch()
	const canUndo = useAppSelector(s => s.history.canUndo)
	const canRedo = useAppSelector(s => s.history.canRedo)
	const files = useFileCommands()

	return useMemo(() => {
		const enabled: Record<QatItemId, boolean> = {
			new: true,
			open: true,
			save: true,
			undo: canUndo,
			redo: canRedo,
			"print-preview": true,
		}
		const handlers: Record<QatItemId, EmptyVoid> = {
			new: () => files.newDocument(),
			open: () => void files.openDocument(),
			save: () => void files.save(),
			undo: () => paint.undo(),
			redo: () => paint.redo(),
			"print-preview": () => void dispatch(openDialog("print-preview")),
		}

		return QAT_ORDER.map(id => ({
			...QAT_ITEMS[id],
			title: tooltipWithShortcut(
				QAT_ITEMS[id].labelKey,
				QAT_ITEMS[id].shortcutKey,
			),
			disabled: !enabled[id],
			onClick: handlers[id],
		}))
	}, [canUndo, canRedo, i18n.language, files, dispatch])
}
