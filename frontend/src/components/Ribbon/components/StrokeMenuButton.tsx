import { useTranslation } from "react-i18next"
import { STROKE_STYLES } from "../constant"
import { Icon } from "components/Icon"
import { Menu, MenuAnchor, MenuItem } from "components/Menu"
import { strokeStyleKey } from "../common"
import type { StrokeMenuButtonProps } from "../types"

/** seven-item menu shared by Outline and Fill. */
export function StrokeMenuButton({
	menuId,
	label,
	value,
	disabled,
	open,
	onToggle,
	onPick,
}: StrokeMenuButtonProps) {
	const { t } = useTranslation()
	const isFill = menuId === "fill"

	return (
		<MenuAnchor>
			<button
				type="button"
				className="ribbon-btn ribbon-btn--small shape-gallery__option-btn"
				disabled={disabled}
				aria-expanded={open}
				onClick={onToggle}
			>
				<span className="ribbon-btn__label">{label}</span>
				<Icon name="caretDown" size={8} className="ribbon-btn__caret" />
			</button>
			{open && !disabled && (
				<Menu width={160}>
					{STROKE_STYLES.map(style => (
						<MenuItem
							key={style.id}
							label={t(strokeStyleKey(style.id, style.labelKey, isFill))}
							radio
							checked={value === style.id}
							onClick={() => onPick(style.id)}
						/>
					))}
				</Menu>
			)}
		</MenuAnchor>
	)
}
