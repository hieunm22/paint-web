import type { FileMenuRow, RecentPicture } from "./types"

/**
 * left column. Three original entries are remapped for the web: scanner
 * becomes From camera, email becomes Copy image, desktop background is dropped.
 */
export const FILE_MENU_ROWS: FileMenuRow[] = [
	{
		labelKey: "filemenu.item.new",
		icon: "new",
		shortcutKey: "shortcut.file.new",
	},
	{
		labelKey: "filemenu.item.open",
		icon: "open",
		shortcutKey: "shortcut.file.open",
	},
	{
		labelKey: "filemenu.item.save",
		icon: "save",
		shortcutKey: "shortcut.file.save",
	},
	{
		labelKey: "filemenu.item.save-as",
		icon: "saveAs",
		submenu: true,
		dialog: "save-as",
	},
	"sep",
	{ labelKey: "filemenu.item.print", icon: "print", submenu: true },
	{
		labelKey: "filemenu.item.from-camera",
		icon: "camera",
		noteKey: "filemenu.item.from-camera-note",
	},
	{ labelKey: "filemenu.item.copy-image", icon: "copy" },
	"sep",
	{
		labelKey: "filemenu.item.properties",
		icon: "properties",
		shortcutKey: "shortcut.file.properties",
		dialog: "image-properties",
	},
	{ labelKey: "filemenu.item.about", icon: "about", dialog: "about" },
	{ labelKey: "filemenu.item.exit", icon: "exit" },
]

/** placeholder; the real list reads FileSystemFileHandle from IndexedDB. */
export const RECENT_PICTURES: RecentPicture[] = [
	{ name: "sunset.png", location: "~/Pictures", agoDays: 2 },
	{ name: "sketch.bmp", location: "~/Pictures", agoDays: 3 },
	{ name: "logo-draft.jpg", location: "~/Pictures", agoDays: 4 },
]
