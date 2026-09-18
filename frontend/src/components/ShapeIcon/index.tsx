import type { ShapeIconProps } from "./types"
import { SHAPE_PATHS } from "./constant"

export function ShapeIcon({ kind, size = 24 }: ShapeIconProps) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="#3b3b3b"
			strokeWidth="1.4"
			strokeLinejoin="round"
			strokeLinecap="round"
			aria-hidden
		>
			{SHAPE_PATHS[kind]}
		</svg>
	)
}
