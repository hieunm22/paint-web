import type { ICONS, SVG_ICON_WIDTHS } from "./constant"

export type SvgIconName = keyof typeof SVG_ICON_WIDTHS

export type IconName = keyof typeof ICONS | SvgIconName

export interface SvgGlyphProps {
	name: SvgIconName
}

export interface IconProps {
	name: IconName
	/** size in px: 16 for small buttons, 24 for the tools grid, 32 for large. */
	size?: number
	color?: string
	className?: string
	/** glyph rotation in degrees, used by the calligraphy brushes. */
	rotate?: number
}
