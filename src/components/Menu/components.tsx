import { useRef } from "react"
import { Icon } from "components/Icon"
import { menuItemRole } from "./common"
import { MenuAnchorContext } from "./hooks"
import type {
	MenuAnchorProps,
	MenuItemProps,
	MenuSectionLabelProps,
} from "./types"

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

export function MenuItem({
	label,
	icon,
	shortcut,
	disabled,
	checked,
	radio,
	submenu,
	onClick,
}: MenuItemProps) {
	return (
		<button
			type="button"
			className="menu__item"
			role={menuItemRole(checked, radio)}
			disabled={disabled}
			aria-checked={checked}
			aria-haspopup={submenu ? "menu" : undefined}
			onClick={onClick}
		>
			<span className="menu__item-icon">
				{checked !== undefined
					? checked && (
							<span className="menu__check">
								<Icon name="check" size={11} />
							</span>
						)
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
