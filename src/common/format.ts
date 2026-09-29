import {
	DEFAULT_FORMAT,
	EXTENSIONS,
	FORMAT_ALIASES,
	FORMATS,
	MIME_TYPES,
	READ_ONLY_TYPES,
} from "common/constant"
import type { ImageFormat } from "types/store.types"

/** which of the five a file claims to be; anything else opens as png. */
export function formatOfMime(mime: string): ImageFormat {
	const match = FORMATS.find(format => MIME_TYPES[format] === mime)
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
		[MIME_TYPES[format]]: [
			EXTENSIONS[format],
			...(FORMAT_ALIASES[format] ?? []),
		],
	}
}

/** every format at once plus the ones only read, for the open picker. */
export function acceptAnyImage(): Record<string, string[]> {
	return Object.assign({}, ...FORMATS.map(acceptFor), READ_ONLY_TYPES)
}

/** a type the app opens and cannot write, by name where the type is missing. */
export function isReadOnlyImage(file: File): boolean {
	if (file.type in READ_ONLY_TYPES) return true

	const name = file.name.toLowerCase()
	const extensions = Object.values(READ_ONLY_TYPES).flat()
	return extensions.some(extension => name.endsWith(extension))
}

/** windows has no type for heic without an extra codec, hence the name check. */
export function isImageFile(file: File): boolean {
	return file.type.startsWith("image/") || isReadOnlyImage(file)
}
