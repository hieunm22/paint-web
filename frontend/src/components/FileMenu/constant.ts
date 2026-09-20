import type { ImageFormat } from "types/store.types"
import type { FileMenuRow } from "./types"

/**
 * left column. Three original entries are remapped for the web: scanner
 * becomes From camera, email becomes Copy image, desktop background is dropped.
 */
export const FILE_MENU_ROWS: FileMenuRow[] = [
	{
		labelKey: "filemenu.item.new",
		icon: "new",
		shortcutKey: "shortcut.file.new",
		action: "new",
	},
	{
		labelKey: "filemenu.item.open",
		icon: "open",
		shortcutKey: "shortcut.file.open",
		action: "open",
	},
	{
		labelKey: "filemenu.item.save",
		icon: "save",
		shortcutKey: "shortcut.file.save",
		action: "save",
	},
	{
		labelKey: "filemenu.item.save-as",
		icon: "saveAs",
		shortcutKey: "shortcut.file.save-as",
		submenu: true,
		action: "save-as",
	},
	"sep",
	{
		labelKey: "filemenu.item.print",
		icon: "print",
		submenu: true,
		pending: true,
	},
	{
		labelKey: "filemenu.item.from-camera",
		icon: "camera",
		noteKey: "filemenu.item.from-camera-note",
		pending: true,
	},
	{ labelKey: "filemenu.item.copy-image", icon: "copy", action: "copy-image" },
	"sep",
	{
		labelKey: "filemenu.item.properties",
		icon: "properties",
		shortcutKey: "shortcut.file.properties",
		dialog: "image-properties",
	},
	{ labelKey: "filemenu.item.about", icon: "about", dialog: "about" },
	{ labelKey: "filemenu.item.exit", icon: "exit", action: "exit" },
]

/** the four formats Save as offers in one click; the rest go via the dialog. */
export const QUICK_SAVE_FORMATS: ImageFormat[] = ["png", "jpeg", "bmp", "gif"]

/** menu id the Save as flyout is registered under. */
export const SAVE_AS_MENU = "file-save-as"
