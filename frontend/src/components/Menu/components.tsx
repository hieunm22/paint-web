import { useRef } from "react"
import { MenuAnchorContext } from "./hooks"
import type { MenuAnchorProps } from "./types"

/**
 * marks the element a portalled menu should align itself to, and shields the
 * button inside from the outside-click handler: dismissing on the way down
 * would let the opener's own click reopen what it just closed.
 * keeps the anchor's own class, which stops the wrapper from changing layout.
 */
export function MenuAnchor({ children, className }: MenuAnchorProps) {
	const ref = useRef<HTMLDivElement>(null)

	return (
		<MenuAnchorContext.Provider value={ref}>
			<div ref={ref} className={className ?? "menu-anchor"} data-menu-root>
				{children}
			</div>
		</MenuAnchorContext.Provider>
	)
}
