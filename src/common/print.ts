import {
	CSS_DPI,
	MM_PER_INCH,
	PAPER_CSS_NAMES,
	PAPER_SIZES,
	PRINT_RELEASE_MS,
} from "common/constant"
import type { PrintLayout } from "types/common.types"
import type { Size } from "types/engine.types"
import type { PrintSetup } from "types/store.types"

/** kept out of the flow and off the reading order while the sheet is built. */
const HIDDEN_FRAME =
	"position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden"

const ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
}

function escapeHtml(value: string): string {
	return value.replace(/[&<>"]/g, match => ESCAPES[match] ?? match)
}

/** the picture's size on paper, a pixel counting as one 96th of an inch. */
function naturalSize({ width, height }: Size): Size {
	return {
		width: (width / CSS_DPI) * MM_PER_INCH,
		height: (height / CSS_DPI) * MM_PER_INCH,
	}
}

/** where one sheet puts the picture, which the preview and the printer share. */
export function printLayout(doc: Size, setup: PrintSetup): PrintLayout {
	const paper = PAPER_SIZES[setup.paper]
	const upright = setup.orientation === "portrait"
	const pageWidth = upright ? paper.width : paper.height
	const pageHeight = upright ? paper.height : paper.width
	const {
		top,
		right,
		bottom,
		left,
	} = setup.margins
	const boxWidth = Math.max(1, pageWidth - left - right)
	const boxHeight = Math.max(1, pageHeight - top - bottom)

	const natural = naturalSize(doc)
	const scale = setup.fit
		? Math.min(1, boxWidth / natural.width, boxHeight / natural.height)
		: Math.max(0, setup.scale) / 100
	const width = natural.width * scale
	const height = natural.height * scale

	return {
		pageWidth,
		pageHeight,
		boxX: left,
		boxY: top,
		boxWidth,
		boxHeight,
		width,
		height,
		x: setup.centerH ? Math.max(0, (boxWidth - width) / 2) : 0,
		y: setup.centerV ? Math.max(0, (boxHeight - height) / 2) : 0,
	}
}

/**
 * the sheet itself. the page box already starts at the margin, which is what
 * lets the offsets be measured from the corner of the printable box.
 */
function printDocument(
	src: string,
	layout: PrintLayout,
	setup: PrintSetup,
	title: string,
): string {
	const { margins } = setup
	const page = `${PAPER_CSS_NAMES[setup.paper]} ${setup.orientation}`

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
@page { size: ${page}; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }
html, body { margin: 0; padding: 0; }
img {
	position: absolute;
	left: ${layout.x}mm;
	top: ${layout.y}mm;
	width: ${layout.width}mm;
	height: ${layout.height}mm;
	image-rendering: pixelated;
}
</style>
</head>
<body><img src="${escapeHtml(src)}" alt=""></body>
</html>`
}

function whenLoaded(image: HTMLImageElement): Promise<void> {
	if (image.complete) return Promise.resolve()

	return new Promise((resolve, reject) => {
		image.addEventListener("load", () => resolve(), { once: true })
		image.addEventListener(
			"error",
			() => reject(new Error("the sheet holds no picture")),
			{ once: true },
		)
	})
}

/**
 * prints through a hidden frame of its own: printing the app's own page would
 * put the ribbon on the paper. the browser's print dialog still has the say.
 */
export function printImage(
	src: string,
	doc: Size,
	setup: PrintSetup,
	title: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		const frame = document.createElement("iframe")
		frame.setAttribute("aria-hidden", "true")
		frame.style.cssText = HIDDEN_FRAME

		const release = () => {
			window.setTimeout(() => frame.remove(), PRINT_RELEASE_MS)
		}

		frame.addEventListener("load", () => {
			const view = frame.contentWindow
			const image = frame.contentDocument?.querySelector("img")
			if (!view || !image) {
				frame.remove()
				reject(new Error("the print frame stayed empty"))
				return
			}

			whenLoaded(image)
				.then(() => {
					view.addEventListener("afterprint", release, { once: true })
					view.focus()
					view.print()
					// a browser that never fires afterprint still gets tidied up
					release()
					resolve()
				})
				.catch(error => {
					frame.remove()
					reject(error)
				})
		})

		const layout = printLayout(doc, setup)
		frame.srcdoc = printDocument(src, layout, setup, title)
		document.body.append(frame)
	})
}
