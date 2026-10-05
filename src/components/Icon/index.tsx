import classnames from "classnames"
import { ICONS, SVG_ICON_WIDTHS } from "./constant"
import { SvgGlyph } from "./components"
import type { IconProps, SvgIconName } from "./types"

/**
 * a font glyph, or an svg sized in em for glyphs the font lacks. size drives
 * font-size only: a fixed width would let wide glyphs spill out.
 */
export function Icon({
	name,
	size = 16,
	color,
	className,
	rotate,
}: IconProps) {
	const style = {
		fontSize: size,
		color,
		transform: rotate ? `rotate(${rotate}deg)` : undefined,
	}

	if (name in SVG_ICON_WIDTHS) {
		const svgName = name as SvgIconName
		const width = SVG_ICON_WIDTHS[svgName]

		return (
			<svg
				className={className}
				style={style}
				width={`${width / 16}em`}
				height="1em"
				viewBox={`0 0 ${width} 16`}
				aria-hidden
			>
				<SvgGlyph name={svgName} />
			</svg>
		)
	}

	return (
		<i
			className={classnames(ICONS[name as keyof typeof ICONS], className)}
			style={style}
			aria-hidden
		/>
	)
}
