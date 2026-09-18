import type { QatItem, WindowButton } from "./types"

/** Quick Access Toolbar. Undo and Redo stay disabled until history has data. */
export const QAT_ITEMS: QatItem[] = [
	{ id: "save", icon: "save", title: "Save (Ctrl+S)" },
	{ id: "undo", icon: "undo", title: "Undo (Ctrl+Z)", disabled: true },
	{ id: "redo", icon: "redo", title: "Redo (Ctrl+Y)", disabled: true },
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
		title: "Không khả dụng trên web — dùng nút thu nhỏ của trình duyệt",
		disabled: true,
	},
	{
		id: "maximize",
		icon: "maximize",
		size: 11,
		title: "Maximise (toàn màn hình)",
	},
	{ id: "close", icon: "close", size: 14, title: "Close" },
]
