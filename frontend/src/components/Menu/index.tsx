import { useRef } from "react"
import { createPortal } from "react-dom"
import { Icon } from "components/Icon"
import { useMenuDismiss, useMenuPlacement } from "./hooks"
import type { MenuItemProps, MenuProps, MenuSectionLabelProps } from "./types"
import "./Menu.scss"

/**
 * rendered into document.body to escape the ribbon's overflow clipping.
 * data-menu-root keeps clicks inside the menu from dismissing it.
 */
export function Menu({ children, width }: MenuProps) {
	const ref = useRef<HTMLDivElement>(null)
	const position = useMenuPlacement(ref)
	const dismiss = useMenuDismiss()

	return createPortal(
		<div
			ref={ref}
			className="menu"
			role="menu"
			data-menu-root
			onClick={dismiss}
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

export function MenuItem({
	label,
	icon,
	shortcut,
	disabled,
	checked,
	submenu,
	onClick,
}: MenuItemProps) {
	return (
		<button
			type="button"
			className="menu__item"
			role="menuitem"
			disabled={disabled}
			aria-checked={checked}
			onClick={onClick}
		>
			<span className="menu__item-icon">
				{checked !== undefined
					? checked && <span className="menu__check">✓</span>
					: icon && <Icon name={icon} size={14} />}
			</span>
			<span className="menu__item-label">{label}</span>
			{shortcut && <span className="menu__item-shortcut">{shortcut}</span>}
			{submenu && <Icon name="caretDown" size={8} className="menu__caret" />}
		</button>
	)
}

export function MenuSectionLabel({ children }: MenuSectionLabelProps) {
	return <div className="menu__section-label">{children}</div>
}

export function MenuSeparator() {
	return <div className="menu__sep" role="separator" />
}

export { MenuAnchor } from "./components"
