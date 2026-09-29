import { MIME_TYPES } from "common/constant"
import type { Size } from "types/engine.types"

/** the largest side a directory entry can name; 256 itself is written as 0. */
const MAX_SIDE = 256

/** an ICONDIR of 6 bytes and one ICONDIRENTRY of 16, then the png. */
const HEADER = 22

/** the picture shrunk to fit an icon, never grown, keeping its proportions. */
export function iconSize(size: Size): Size {
	const longest = Math.max(size.width, size.height)
	const scale = Math.min(1, MAX_SIDE / longest)

	return {
		width: Math.max(1, Math.round(size.width * scale)),
		height: Math.max(1, Math.round(size.height * scale)),
	}
}

/** one png inside an ico container, the form windows has read since vista. */
export function wrapIco(png: Uint8Array, size: Size): Blob {
	const header = new ArrayBuffer(HEADER)
	const view = new DataView(header)

	// ICONDIR: reserved, type 1 for an icon, one image
	view.setUint16(2, 1, true)
	view.setUint16(4, 1, true)

	// ICONDIRENTRY: a side of 256 does not fit the byte and goes in as 0
	view.setUint8(6, size.width % MAX_SIDE)
	view.setUint8(7, size.height % MAX_SIDE)
	view.setUint16(10, 1, true)
	view.setUint16(12, 32, true)
	view.setUint32(14, png.byteLength, true)
	view.setUint32(18, HEADER, true)

	return new Blob([header, png], { type: MIME_TYPES.ico })
}
