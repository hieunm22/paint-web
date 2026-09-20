import type { QatItemId } from "types/store.types"
import type { QatItemDef, WindowButton } from "./types"

/**
 * Quick Access Toolbar, keyed rather than listed: the order is QAT_ORDER and
 * belongs in one place. what each item may do is decided in the hook.
 */
export const QAT_ITEMS: Record<QatItemId, QatItemDef> = {
	new: {
		id: "new",
		icon: "new",
		labelKey: "titlebar.qat.new",
		shortcutKey: "shortcut.file.new",
	},
	open: {
		id: "open",
		icon: "open",
		labelKey: "titlebar.qat.open",
		shortcutKey: "shortcut.file.open",
	},
	save: {
		id: "save",
		icon: "save",
		labelKey: "titlebar.qat.save",
		shortcutKey: "shortcut.file.save",
	},
	undo: {
		id: "undo",
		icon: "undo",
		labelKey: "titlebar.qat.undo",
		shortcutKey: "shortcut.edit.undo",
	},
	redo: {
		id: "redo",
		icon: "redo",
		labelKey: "titlebar.qat.redo",
		shortcutKey: "shortcut.edit.redo",
	},
	// the only one Paint gives no shortcut, and the tooltip is the bare label
	"print-preview": {
		id: "print-preview",
		icon: "printPreview",
		labelKey: "titlebar.qat.print-preview",
	},
}

/**
 * all three window buttons stay visible to keep the shape, but the behaviour is
 * remapped: minimize disabled, maximize goes fullscreen, close tries window.close.
 */
export const WINDOW_BUTTONS: WindowButton[] = [
	{
		id: "minimize",
		icon: "minimize",
		size: 11,
		titleKey: "titlebar.window.minimize",
		disabled: true,
	},
	{
		id: "maximize",
		icon: "maximize",
		size: 11,
		titleKey: "titlebar.window.maximize",
	},
	{ id: "close", icon: "close", size: 14, titleKey: "titlebar.window.close" },
]
