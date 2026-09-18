import type { ButtonStackProps, RibbonGroupProps } from "./types"
import "./RibbonGroup.scss"

/** Ribbon group frame: the button area with the group label at the bottom. */
export function RibbonGroup({ label, children }: RibbonGroupProps) {
	return (
		<section
			className="ribbon-group"
			aria-label={label}
		>
			<div className="ribbon-group__body">{children}</div>
			<div className="ribbon-group__label">{label}</div>
		</section>
	)
}

/** stacks small buttons in a vertical column. */
export function ButtonStack({ children }: ButtonStackProps) {
	return <div className="ribbon-group__stack">{children}</div>
}
