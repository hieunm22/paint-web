import { useRef } from "react"
import { MenuAnchorContext } from "./hooks"
import type { MenuAnchorProps } from "./types"

/**
 * what a portalled menu aligns itself to. it also shields its button from the
 * outside-click handler, which would reopen the menu that click just closed.
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
