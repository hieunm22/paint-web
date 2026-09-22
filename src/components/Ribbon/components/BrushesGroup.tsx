import classnames from "classnames"
import { useTranslation } from "react-i18next"
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
import { BRUSHES } from "../constant"
import { Icon } from "components/Icon"
import { Menu } from "components/Menu"
import { SplitButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setBrush } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"

/** the button keeps the selected brush icon; the menu opens the 9-brush gallery. */
export function BrushesGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const { active, brush } = useAppSelector(s => s.tool)
	const open = useAppSelector(s => s.ui.openMenu) === "brushes"
	const current = BRUSHES.find(b => b.id === brush) ?? BRUSHES[0]

	return (
		<RibbonGroup label={t("ribbon.brushes.label")}>
			<SplitButton
				label={t("ribbon.brushes.label")}
				iconNode={
					<Icon name={current.icon} size={30} rotate={current.rotate} />
				}
				selected={active === "brush"}
				disabled={!IMPLEMENTED.brush}
				onClick={() => dispatch(setBrush(brush))}
				open={open}
				onToggleMenu={() => dispatch(toggleMenu("brushes"))}
				menu={
					<Menu width={0}>
						<div className="brush-gallery">
							{BRUSHES.map(b => {
								const cls = classnames("brush-gallery__cell", {
									"brush-gallery__cell--selected": brush === b.id,
								})

								return (
									<button
										key={b.id}
										type="button"
										className={cls}
										title={t(b.labelKey)}
										aria-label={t(b.labelKey)}
										onClick={() => dispatch(setBrush(b.id))}
									>
										<Icon name={b.icon} size={18} rotate={b.rotate} />
									</button>
								)
							})}
						</div>
					</Menu>
				}
			/>
		</RibbonGroup>
	)
}
