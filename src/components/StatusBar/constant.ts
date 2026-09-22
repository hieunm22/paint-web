import type { IconName } from "components/Icon/types"

/** the picture settles before it is encoded: the spec asks for one second. */
export const SIZE_ESTIMATE_MS = 1000

/** the glyph in front of each info cell. */
export const CELL_ICONS: Record<string, IconName> = {
	cursor: "crosshairs",
	selection: "select",
	document: "thumbnail",
	fileSize: "folder",
}
