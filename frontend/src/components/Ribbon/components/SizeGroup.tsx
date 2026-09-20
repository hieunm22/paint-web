import { useTranslation } from "react-i18next"
import { SIZES } from "../constant"
import { Menu, MenuAnchor } from "components/Menu"
import { LargeButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setSize } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"

/**
 * one button rather than a split one: Size has no action of its own, every
 * click opens the menu. the menu renders real 1, 3, 5 and 8 px rules.
 */
export function SizeGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const size = useAppSelector(s => s.tool.size)
	const open = useAppSelector(s => s.ui.openMenu) === "size"

	return (
		<RibbonGroup label={t("ribbon.size.label")}>
			<MenuAnchor>
				<LargeButton
					label={t("ribbon.size.label")}
					title={t("ribbon.size.tooltip", { 0: size })}
					caret
					selected={open}
					iconNode={
						<div className="size-preview">
							{SIZES.map(s => (
								<div
									key={s}
									className="size-line"
									style={{ height: s, width: 28 }}
								/>
							))}
						</div>
					}
					onClick={() => dispatch(toggleMenu("size"))}
				/>
				{open && (
					<Menu width={96}>
						{SIZES.map(s => (
							<button
								key={s}
								type="button"
								className={`size-menu__item${size === s ? " size-menu__item--selected" : ""}`}
								title={t("ribbon.size.value", { 0: s })}
								aria-label={t("ribbon.size.value", { 0: s })}
								aria-checked={size === s}
								onClick={() => dispatch(setSize(s))}
							>
								<div className="size-line" style={{ height: s, width: 70 }} />
							</button>
						))}
					</Menu>
				)}
			</MenuAnchor>
		</RibbonGroup>
	)
}
