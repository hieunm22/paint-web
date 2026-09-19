/**
 * icon registry of Font Awesome Pro webfont classes, keyed by meaning.
 * Shape gallery geometry is not from FA; see ShapeIcon/constant.tsx.
 */

export const ICONS = {
	// Quick Access Toolbar + title bar
	save: "fa-solid fa-floppy-disk",
	undo: "fa-solid fa-rotate-left",
	redo: "fa-solid fa-rotate-right",
	caretDown: "fa-solid fa-caret-down",
	caretUp: "fa-solid fa-caret-up",
	minimize: "fa-solid fa-window-minimize",
	maximize: "fa-solid fa-window-maximize",
	close: "fa-solid fa-xmark",

	// Clipboard
	paste: "fa-solid fa-paste",
	cut: "fa-solid fa-scissors",
	copy: "fa-solid fa-copy",
	clipboard: "fa-solid fa-clipboard",

	// shared marks that used to be typed as literal glyphs
	check: "fa-solid fa-check",
	minus: "fa-solid fa-minus",
	plus: "fa-solid fa-plus",
	arrowsH: "fa-solid fa-arrows-left-right",
	arrowsV: "fa-solid fa-arrows-up-down",

	// Image
	select: "fa-solid fa-draw-square",
	crop: "fa-solid fa-crop-simple",
	resize: "fa-solid fa-up-right-and-down-left-from-center",
	rotate: "fa-solid fa-rotate",

	// Tools
	pencil: "fa-solid fa-pencil",
	fill: "fa-solid fa-fill-drip",
	text: "fa-solid fa-a",
	eraser: "fa-solid fa-eraser",
	picker: "fa-solid fa-eye-dropper",
	magnifier: "fa-solid fa-magnifying-glass",

	// Brushes
	brush: "fa-solid fa-paintbrush",
	calligraphy1: "fa-solid fa-pen-nib",
	calligraphy2: "fa-solid fa-pen-nib",
	airbrush: "fa-solid fa-spray-can",
	oil: "fa-solid fa-brush",
	crayon: "fa-solid fa-pencil",
	marker: "fa-solid fa-highlighter",
	"natural-pencil": "fa-solid fa-pen-fancy",
	watercolor: "fa-solid fa-droplet",

	// Status bar cells
	crosshairs: "fa-solid fa-crosshairs",
	folder: "fa-solid fa-folder",

	// Size
	size: "fa-solid fa-grip-lines",

	// checkbox state. regular keeps the empty box an outline; the solid
	// faSquare is a filled block that reads as checked.
	checked: "fa-regular fa-square-check",
	unchecked: "fa-regular fa-square",

	// View tab
	zoomIn: "fa-solid fa-magnifying-glass-plus",
	zoomOut: "fa-solid fa-magnifying-glass-minus",
	zoom100: "fa-solid fa-magnifying-glass",
	rulers: "fa-solid fa-ruler-combined",
	gridlines: "fa-solid fa-border-all",
	statusBar: "fa-solid fa-window-minimize",
	fullScreen: "fa-solid fa-expand",
	thumbnail: "fa-solid fa-image",

	// Backstage (File tab)
	new: "fa-solid fa-file",
	open: "fa-solid fa-folder-open",
	saveAs: "fa-solid fa-file-export",
	print: "fa-solid fa-print",
	camera: "fa-solid fa-camera",
	properties: "fa-solid fa-circle-info",
	about: "fa-solid fa-circle-question",
	exit: "fa-solid fa-right-from-bracket",
	recent: "fa-solid fa-images",
} satisfies Record<string, string>
