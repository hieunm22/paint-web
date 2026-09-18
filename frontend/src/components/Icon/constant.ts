/**
 * icon registry backed by Font Awesome Pro, picking the closest glyph by meaning.
 * Shape gallery geometry is not from FA; see ShapeIcon/constant.tsx.
 */
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core"
import {
	faA,
	faBorderAll,
	faBrush,
	faCamera,
	faCaretDown,
	faCircleInfo,
	faCircleQuestion,
	faClipboard,
	faCopy,
	faCropSimple,
	faDroplet,
	faEraser,
	faExpand,
	faEyeDropper,
	faFile,
	faFileExport,
	faFillDrip,
	faFloppyDisk,
	faFolderOpen,
	faGripLines,
	faHighlighter,
	faImage,
	faImages,
	faMagnifyingGlass,
	faMagnifyingGlassMinus,
	faMagnifyingGlassPlus,
	faPaintbrush,
	faPaste,
	faPencil,
	faPenFancy,
	faPenNib,
	faPrint,
	faRightFromBracket,
	faRotate,
	faRotateLeft,
	faRotateRight,
	faRulerCombined,
	faScissors,
	faSprayCan,
	faUpRightAndDownLeftFromCenter,
	faVectorSquare,
	faWindowMaximize,
	faWindowMinimize,
	faXmark,
} from "@fortawesome/pro-solid-svg-icons"

export const ICONS = {
	// Quick Access Toolbar + title bar
	save: faFloppyDisk,
	undo: faRotateLeft,
	redo: faRotateRight,
	caretDown: faCaretDown,
	minimize: faWindowMinimize,
	maximize: faWindowMaximize,
	close: faXmark,

	// Clipboard
	paste: faPaste,
	cut: faScissors,
	copy: faCopy,
	clipboard: faClipboard,

	// Image
	select: faVectorSquare,
	crop: faCropSimple,
	resize: faUpRightAndDownLeftFromCenter,
	rotate: faRotate,

	// Tools
	pencil: faPencil,
	fill: faFillDrip,
	text: faA,
	eraser: faEraser,
	picker: faEyeDropper,
	magnifier: faMagnifyingGlass,

	// Brushes
	brush: faPaintbrush,
	calligraphy1: faPenNib,
	calligraphy2: faPenNib,
	airbrush: faSprayCan,
	oil: faBrush,
	crayon: faPencil,
	marker: faHighlighter,
	"natural-pencil": faPenFancy,
	watercolor: faDroplet,

	// Size
	size: faGripLines,

	// View tab
	zoomIn: faMagnifyingGlassPlus,
	zoomOut: faMagnifyingGlassMinus,
	zoom100: faMagnifyingGlass,
	rulers: faRulerCombined,
	gridlines: faBorderAll,
	statusBar: faWindowMinimize,
	fullScreen: faExpand,
	thumbnail: faImage,

	// Backstage (File tab)
	new: faFile,
	open: faFolderOpen,
	saveAs: faFileExport,
	print: faPrint,
	camera: faCamera,
	properties: faCircleInfo,
	about: faCircleQuestion,
	exit: faRightFromBracket,
	recent: faImages,
} satisfies Record<string, IconDefinition>
