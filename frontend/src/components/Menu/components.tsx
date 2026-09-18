import { useRef } from "react"
import { MenuAnchorContext } from "./hooks"
import type { MenuAnchorProps } from "./types"

/**
 * marks the element a portalled menu should align itself to.
 * keeps the anchor's own class, which stops the wrapper from changing layout.
 */
export function MenuAnchor({ children, className }: MenuAnchorProps) {
	const ref = useRef<HTMLDivElement>(null)

	return (
		<MenuAnchorContext.Provider value={ref}>
			<div
				ref={ref}
				className={className ?? "menu-anchor"}
			>
				{children}
			</div>
		</MenuAnchorContext.Provider>
	)
}
