import type { ImageFormat } from "store/types"

/** the default when a file arrives with a type the app does not write. */
const DEFAULT_FORMAT: ImageFormat = "png"

export const MIME_TYPES: Record<ImageFormat, string> = {
	png: "image/png",
	jpeg: "image/jpeg",
	bmp: "image/bmp",
	gif: "image/gif",
	webp: "image/webp",
}

export const EXTENSIONS: Record<ImageFormat, string> = {
	png: ".png",
	jpeg: ".jpg",
	bmp: ".bmp",
	gif: ".gif",
	webp: ".webp",
}

/** the extra spellings a picker should still accept for a format. */
const ALIASES: Partial<Record<ImageFormat, string[]>> = {
	jpeg: [".jpeg"],
	bmp: [".dib"],
}

export const FORMATS = Object.keys(MIME_TYPES) as ImageFormat[]

/** which of the five a file claims to be; anything else opens as png. */
export function formatOfMime(mime: string): ImageFormat {
	const match = FORMATS.find((format) => MIME_TYPES[format] === mime)
	return match ?? DEFAULT_FORMAT
}

/** swaps whatever extension a name carries for the one the format uses. */
export function withExtension(name: string, format: ImageFormat): string {
	const stem = name.replace(/\.[^./\\]+$/, "")
	return `${stem}${EXTENSIONS[format]}`
}

/** name without its extension, which is what the save dialog shows. */
export function stemOf(name: string): string {
	return name.replace(/\.[^./\\]+$/, "")
}

/** the accept map both file pickers take, mime to the extensions it covers. */
export function acceptFor(format: ImageFormat): Record<string, string[]> {
	return {
		[MIME_TYPES[format]]: [EXTENSIONS[format], ...(ALIASES[format] ?? [])],
	}
}

/** every format at once, for the open picker. */
export function acceptAnyImage(): Record<string, string[]> {
	return Object.assign({}, ...FORMATS.map(acceptFor))
}
