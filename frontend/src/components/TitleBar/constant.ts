import type { QatItemDef, WindowButton } from "./types"

/** Quick Access Toolbar. what each item may do is decided in the hook. */
export const QAT_ITEMS: QatItemDef[] = [
	{
		id: "save",
		icon: "save",
		labelKey: "titlebar.qat.save",
		shortcutKey: "shortcut.file.save",
	},
	{
		id: "undo",
		icon: "undo",
		labelKey: "titlebar.qat.undo",
		shortcutKey: "shortcut.edit.undo",
	},
	{
		id: "redo",
		icon: "redo",
		labelKey: "titlebar.qat.redo",
		shortcutKey: "shortcut.edit.redo",
	},
]

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
