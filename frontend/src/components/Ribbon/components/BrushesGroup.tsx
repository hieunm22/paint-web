import { Icon } from "components/Icon"
import { Menu } from "components/Menu"
import { SplitButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setBrush } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"
import { BRUSHES } from "../constant"

/** the button keeps the selected brush icon; the menu opens the 9-brush gallery. */
export function BrushesGroup() {
	const dispatch = useAppDispatch()
	const { active, brush } = useAppSelector((s) => s.tool)
	const open = useAppSelector((s) => s.ui.openMenu) === "brushes"
	const current = BRUSHES.find((b) => b.id === brush) ?? BRUSHES[0]

	return (
		<RibbonGroup label="Brushes">
			<SplitButton
				label="Brushes"
				iconNode={
					<Icon name={current.icon} size={30} rotate={current.rotate} />
				}
				selected={active === "brush"}
				onClick={() => dispatch(setBrush(brush))}
				open={open}
				onToggleMenu={() => dispatch(toggleMenu("brushes"))}
				menu={
					<Menu width={0}>
						<div className="brush-gallery">
							{BRUSHES.map((b) => (
								<button
									key={b.id}
									type="button"
									className={`brush-gallery__cell${
										brush === b.id ? " brush-gallery__cell--selected" : ""
									}`}
									title={b.label}
									aria-label={b.label}
									onClick={() => dispatch(setBrush(b.id))}
								>
									<Icon name={b.icon} size={18} rotate={b.rotate} />
								</button>
							))}
						</div>
					</Menu>
				}
			/>
		</RibbonGroup>
	)
}
