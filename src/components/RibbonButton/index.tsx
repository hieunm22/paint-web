import classnames from "classnames"
import { Icon } from "components/Icon"
import { MenuAnchor } from "components/Menu/components"
import type { RibbonButtonProps, SplitButtonProps } from "./types"
import "./RibbonButton.scss"

/**
 * large button: 32px icon on top, label below. with `caret` the whole button
 * opens a menu rather than splitting in two, which is what Size does.
 */
export function LargeButton({
	label,
	icon,
	iconNode,
	title,
	disabled,
	selected,
	caret,
	onClick,
}: RibbonButtonProps) {
	const cls = classnames("ribbon-btn ribbon-btn--large", {
		"ribbon-btn--selected": selected,
	})

	return (
		<button
			type="button"
			className={cls}
			title={title ?? label}
			disabled={disabled}
			aria-pressed={caret ? undefined : selected}
			aria-expanded={caret ? selected : undefined}
			aria-haspopup={caret ? "menu" : undefined}
			onClick={onClick}
		>
			<span className="ribbon-btn__icon ribbon-btn__icon--large">
				{iconNode ?? (icon && <Icon name={icon} size={30} />)}
			</span>
			<span className="ribbon-btn__label ribbon-btn__label--large">
				{label}
			</span>
			{caret && (
				<Icon
					name="caretDown"
					size={8}
					className="ribbon-btn__caret ribbon-btn__caret--large"
				/>
			)}
		</button>
	)
}

/** small button: 16px icon and a single-line label. */
export function SmallButton({
	label,
	icon,
	iconNode,
	title,
	disabled,
	selected,
	caret,
	onClick,
}: RibbonButtonProps) {
	const cls = classnames("ribbon-btn ribbon-btn--small", {
		"ribbon-btn--selected": selected,
	})

	return (
		<button
			type="button"
			className={cls}
			title={title ?? label}
			disabled={disabled}
			aria-pressed={selected}
			onClick={onClick}
		>
			<span className="ribbon-btn__icon ribbon-btn__icon--small">
				{iconNode ?? (icon && <Icon name={icon} size={15} />)}
			</span>
			<span className="ribbon-btn__label">{label}</span>
			{caret && (
				<Icon name="caretDown" size={8} className="ribbon-btn__caret" />
			)}
		</button>
	)
}

/** 24x24 icon-only button used by the tools grid. */
export function IconButton({
	label,
	icon,
	iconNode,
	title,
	disabled,
	selected,
	onClick,
}: RibbonButtonProps) {
	const cls = classnames("ribbon-btn ribbon-btn--icon-only", {
		"ribbon-btn--selected": selected,
	})

	return (
		<button
			type="button"
			className={cls}
			title={title ?? label}
			aria-label={label}
			disabled={disabled}
			aria-pressed={selected}
			onClick={onClick}
		>
			{iconNode ?? (icon && <Icon name={icon} size={16} />)}
		</button>
	)
}

/**
 * split button: the top half is the main action, the bottom half opens the menu.
 * Each half hovers separately, divided by a 1px line shown on hover.
 */
export function SplitButton({
	label,
	icon,
	iconNode,
	title,
	disabled,
	selected,
	onClick,
	menu,
	open,
	onToggleMenu,
}: SplitButtonProps) {
	const topCls = classnames("ribbon-split__top", {
		"ribbon-btn--selected": selected,
	})

	return (
		<MenuAnchor className="ribbon-split">
			<button
				type="button"
				className={topCls}
				title={title ?? label}
				disabled={disabled}
				onClick={() => {
					onClick?.()
					if (open) onToggleMenu?.()
				}}
			>
				<span className="ribbon-btn__icon ribbon-btn__icon--large">
					{iconNode ?? (icon && <Icon name={icon} size={30} />)}
				</span>
			</button>
			<button
				type="button"
				className="ribbon-split__bottom"
				disabled={disabled}
				aria-expanded={open}
				aria-haspopup="menu"
				onClick={onToggleMenu}
			>
				<span className="ribbon-split__label-row">
					{label}
					<Icon name="caretDown" size={8} className="ribbon-btn__caret" />
				</span>
			</button>
			{open && menu}
		</MenuAnchor>
	)
}
