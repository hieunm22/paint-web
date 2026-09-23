import { useRef } from "react"
import { createPortal } from "react-dom"
import { useMenuDismiss, useMenuPlacement } from "./hooks"
import type { MenuProps } from "./types"
import "./Menu.scss"

/**
 * rendered into document.body to escape the ribbon's overflow clipping.
 * data-menu-root keeps clicks inside the menu from dismissing it.
 */
export default function Menu({ children, width, sticky }: MenuProps) {
	const ref = useRef<HTMLDivElement>(null)
	const position = useMenuPlacement(ref)
	const dismiss = useMenuDismiss()

	return createPortal(
		<div
			ref={ref}
			className="menu"
			role="menu"
			data-menu-root
			onClick={sticky ? undefined : dismiss}
			style={{
				minWidth: width,
				top: position?.top ?? 0,
				left: position?.left ?? 0,
				visibility: position ? "visible" : "hidden",
			}}
		>
			{children}
		</div>,
		document.body,
	)
}
