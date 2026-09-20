import type { RGBA, WinHsl } from "types/engine.types"

const HEX = "0123456789abcdef"

/** the Windows colour dialog counts hue to 239 and the other two to 240. */
const WIN_MAX = 240

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

/** channels to the hue, saturation and luminance the colour dialog shows. */
export function rgbaToWinHsl({ r, g, b }: RGBA): WinHsl {
	const red = r / 255
	const green = g / 255
	const blue = b / 255
	const high = Math.max(red, green, blue)
	const low = Math.min(red, green, blue)
	const lum = (high + low) / 2
	const span = high - low
	if (!span) return { h: 0, s: 0, l: Math.round(lum * WIN_MAX) }

	const sat = lum > 0.5 ? span / (2 - high - low) : span / (high + low)
	let hue: number
	if (high === red) hue = ((green - blue) / span) % 6
	else if (high === green) hue = (blue - red) / span + 2
	else hue = (red - green) / span + 4

	hue *= 60
	if (hue < 0) hue += 360

	return {
		h: Math.round((hue * WIN_MAX) / 360) % WIN_MAX,
		s: Math.round(sat * WIN_MAX),
		l: Math.round(lum * WIN_MAX),
	}
}

export function winHslToRgba({ h, s, l }: WinHsl): RGBA {
	const hue = (h / WIN_MAX) * 360
	const sat = s / WIN_MAX
	const lum = l / WIN_MAX
	const chroma = (1 - Math.abs(2 * lum - 1)) * sat
	const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
	const base = lum - chroma / 2
	const [red, green, blue] = sector(hue, chroma, second)

	return {
		r: Math.round((red + base) * 255),
		g: Math.round((green + base) * 255),
		b: Math.round((blue + base) * 255),
		a: 255,
	}
}

/** which two of the three channels the hue lights up, and how far. */
function sector(hue: number, chroma: number, second: number): number[] {
	if (hue < 60) return [chroma, second, 0]
	if (hue < 120) return [second, chroma, 0]
	if (hue < 180) return [0, chroma, second]
	if (hue < 240) return [0, second, chroma]
	if (hue < 300) return [second, 0, chroma]

	return [chroma, 0, second]
}
