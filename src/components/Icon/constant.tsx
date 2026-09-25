import type { SVGProps } from "react"
import type { SvgIcon } from "./types"

const LENS_STROKE: SVGProps<SVGGElement> = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round",
}

/** one id serves every copy: each mask it names is drawn the same. */
const PREVIEW_MASK = "icon-print-preview-lens"

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
	caretRight: "fa-solid fa-caret-right",
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
	crop: "fa-solid fa-crop-simple",
	resize: "fa-solid fa-up-right-and-down-left-from-center",
	rotate: "fa-solid fa-rotate",

	// Image, rotate menu
	flipVertical: "fa-solid fa-arrows-up-down",
	flipHorizontal: "fa-solid fa-arrows-left-right",

	// Text tab
	bold: "fa-solid fa-bold",
	italic: "fa-solid fa-italic",
	underline: "fa-solid fa-underline",
	strikethrough: "fa-solid fa-strikethrough",
	backgroundTransparent: "fa-regular fa-square",
	backgroundOpaque: "fa-solid fa-square",

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
	zoom100: "fa-solid fa-magnifying-glass",
	rulers: "fa-solid fa-ruler-combined",
	gridlines: "fa-solid fa-border-all",
	statusBar: "fa-solid fa-window-minimize",
	fullScreen: "fa-solid fa-expand",
	thumbnail: "fa-solid fa-image",

	// Backstage (File tab)
	back: "fa-solid fa-arrow-left",
	new: "fa-solid fa-file",
	open: "fa-solid fa-folder-open",
	saveAs: "fa-solid fa-file-export",
	print: "fa-solid fa-print",
	pageSetup: "fa-solid fa-file-lines",
	camera: "fa-solid fa-camera",
	properties: "fa-solid fa-circle-info",
	about: "fa-solid fa-circle-question",
	exit: "fa-solid fa-right-from-bracket",
	recent: "fa-solid fa-images",
} satisfies Record<string, string>

/** glyphs Font Awesome Free does not carry, drawn 16 units tall. */
export const SVG_ICONS = {
	select: {
		width: 20,
		glyph: (
			<rect
				x="1.25"
				y="1"
				width="17.5"
				height="14"
				fill="none"
				stroke="currentColor"
				strokeWidth="1"
				strokeDasharray="2 1.5"
				strokeDashoffset="1"
			/>
		),
	},
	zoomIn: {
		width: 16,
		glyph: (
			<g {...LENS_STROKE}>
				<circle cx="6.5" cy="6.5" r="5" />
				<path d="M10.2 10.2 L14.5 14.5 M4.25 6.5 H8.75 M6.5 4.25 V8.75" />
			</g>
		),
	},
	zoomOut: {
		width: 16,
		glyph: (
			<g {...LENS_STROKE}>
				<circle cx="6.5" cy="6.5" r="5" />
				<path d="M10.2 10.2 L14.5 14.5 M4.25 6.5 H8.75" />
			</g>
		),
	},
	printPreview: {
		width: 16,
		glyph: (
			<>
				<mask id={PREVIEW_MASK}>
					<rect width="16" height="16" fill="#fff" />
					<g fill="#000" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
						<circle cx="12.5" cy="12" r="2.5" />
						<path d="M14.3 13.8 L15.25 14.75" />
					</g>
				</mask>
				<path
					fill="currentColor"
					fillRule="evenodd"
					mask={`url(#${PREVIEW_MASK})`}
					d="M2 5 V2 A2 2 0 0 1 4 0 H11.1 L14 2.9 V5 H12 V2.9 L11.1 2 H4 V5 Z M2 12 H1 A1 1 0 0 1 0 11 V8 A2 2 0 0 1 2 6 H14 A2 2 0 0 1 16 8 V11 A1 1 0 0 1 15 12 H14 V14 A2 2 0 0 1 12 16 H4 A2 2 0 0 1 2 14 Z M4 11 V14 H12 V11 Z"
				/>
				<g
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
				>
					<circle cx="12.5" cy="12" r="2.5" />
					<path d="M14.3 13.8 L15.25 14.75" />
				</g>
			</>
		),
	},
} satisfies Record<string, SvgIcon>
