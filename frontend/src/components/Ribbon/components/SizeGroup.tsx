import { Menu } from "components/Menu"
import { SplitButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store"
import { setSize } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"
import { SIZES } from "../constant"

/** the menu renders real 1, 3, 5 and 8 px rules. */
export function SizeGroup() {
	const dispatch = useAppDispatch()
	const size = useAppSelector((s) => s.tool.size)
	const open = useAppSelector((s) => s.ui.openMenu) === "size"

	return (
		<RibbonGroup label="Size">
			<SplitButton
				label="Size"
				title={`Size (${size}px) — Ctrl+= / Ctrl+-`}
				iconNode={
					<div className="size-preview">
						{SIZES.map((s) => (
							<div
								key={s}
								className="size-line"
								style={{ height: s, width: 28 }}
							/>
						))}
					</div>
				}
				open={open}
				onToggleMenu={() => dispatch(toggleMenu("size"))}
				menu={
					<Menu width={96}>
						{SIZES.map((s) => (
							<button
								key={s}
								type="button"
								className={`size-menu__item${size === s ? " size-menu__item--selected" : ""}`}
								title={`${s}px`}
								aria-label={`${s}px`}
								aria-checked={size === s}
								onClick={() => dispatch(setSize(s))}
							>
								<div className="size-line" style={{ height: s, width: 70 }} />
							</button>
						))}
					</Menu>
				}
			/>
		</RibbonGroup>
	)
}
