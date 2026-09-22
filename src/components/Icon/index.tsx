import classnames from "classnames"
import { ICONS } from "./constant"
import type { IconProps } from "./types"

/**
 * a font glyph, not an svg element. size drives font-size only: a fixed width
 * would not scale the glyph the way svg did, it would let wide ones spill out.
 */
export function Icon({
	name,
	size = 16,
	color,
	className,
	rotate,
}: IconProps) {
	const cls = classnames(ICONS[name], className)

	return (
		<i
			className={cls}
			style={{
				fontSize: size,
				color,
				transform: rotate ? `rotate(${rotate}deg)` : undefined,
			}}
			aria-hidden
		/>
	)
}
