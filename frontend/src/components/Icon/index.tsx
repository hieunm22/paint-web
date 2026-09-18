import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import type { IconProps } from "./types"
import { ICONS } from "./constant"

export function Icon({ name, size = 16, color, className, rotate }: IconProps) {
	return (
		<FontAwesomeIcon
			icon={ICONS[name]}
			className={className}
			style={{
				fontSize: size,
				width: size,
				height: size,
				color,
				transform: rotate ? `rotate(${rotate}deg)` : undefined,
			}}
			aria-hidden
		/>
	)
}
