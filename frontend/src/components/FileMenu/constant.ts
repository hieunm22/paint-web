import type { FileMenuRow, RecentPicture } from "./types"

/**
 * left column. Three original entries are remapped for the web: scanner
 * becomes From camera, email becomes Copy image, desktop background is dropped.
 */
export const FILE_MENU_ROWS: FileMenuRow[] = [
	{ label: "New", icon: "new", shortcut: "Ctrl+N" },
	{ label: "Open", icon: "open", shortcut: "Ctrl+O" },
	{ label: "Save", icon: "save", shortcut: "Ctrl+S" },
	{ label: "Save as", icon: "saveAs", submenu: true, dialog: "save-as" },
	"sep",
	{ label: "Print", icon: "print", submenu: true },
	{
		label: "From camera",
		icon: "camera",
		note: "getUserMedia - tối đa ~4K",
	},
	{ label: "Copy image", icon: "copy" },
	"sep",
	{
		label: "Properties",
		icon: "properties",
		shortcut: "Ctrl+E",
		dialog: "image-properties",
	},
	{ label: "About Paint", icon: "about", dialog: "about" },
	{ label: "Exit", icon: "exit" },
]

/** placeholder; the real list reads FileSystemFileHandle from IndexedDB. */
export const RECENT_PICTURES: RecentPicture[] = [
	{ name: "sunset.png", location: "~/Pictures", agoDays: 2 },
	{ name: "sketch.bmp", location: "~/Pictures", agoDays: 3 },
	{ name: "logo-draft.jpg", location: "~/Pictures", agoDays: 4 },
]
