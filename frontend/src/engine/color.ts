import type { RGBA } from "types/engine.types"

const HEX = "0123456789abcdef"

/** "#rrggbb" to channels. an unparsable string comes back opaque black. */
export function hexToRgba(hex: string): RGBA {
	const n = Number.parseInt(hex.replace("#", ""), 16)
	if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0, a: 255 }

	return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 }
}

export function rgbaToHex({ r, g, b }: RGBA): string {
	let hex = "#"
	for (const channel of [r, g, b]) {
		hex += HEX[(channel >> 4) & 15] + HEX[channel & 15]
	}
	return hex
}

export function sameColor(a: RGBA, b: RGBA): boolean {
	return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a
}
