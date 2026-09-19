import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { applyColor, setEditingSwatch } from "store/slices/colorsSlice"
import { openDialog } from "store/slices/uiSlice"
import { ColorSlot } from "./ColorSlot"

/** Color 1 and 2, the 20 standard swatches, 10 custom slots and Edit colours. */
export function ColorsGroup() {
	const dispatch = useAppDispatch()
	const { color1, color2, editing, palette, custom } = useAppSelector(
		(s) => s.colors,
	)

	return (
		<RibbonGroup label="Colours">
			<div className="colors">
				<ColorSlot
					label="Colour 1"
					hex={color1}
					editing={editing === "color1"}
					onClick={() => dispatch(setEditingSwatch("color1"))}
				/>
				<ColorSlot
					label="Colour 2"
					hex={color2}
					editing={editing === "color2"}
					onClick={() => dispatch(setEditingSwatch("color2"))}
				/>

				<div className="colors__palette">
					{palette.map((hex) => (
						<button
							key={hex}
							type="button"
							className="colors__swatch"
							style={{ background: hex }}
							title={hex}
							aria-label={hex}
							onClick={() => dispatch(applyColor(hex))}
						/>
					))}
					{custom.map((hex, i) => (
						<button
							key={i}
							type="button"
							className={`colors__swatch${hex ? "" : " colors__swatch--empty"}`}
							style={hex ? { background: hex } : undefined}
							title={hex ?? "Ô màu tuỳ chỉnh trống"}
							aria-label={hex ?? "Custom colour slot"}
							onClick={() =>
								hex
									? dispatch(applyColor(hex))
									: dispatch(openDialog("edit-colors"))
							}
						/>
					))}
				</div>

				<button
					type="button"
					className="colors__edit"
					onClick={() => dispatch(openDialog("edit-colors"))}
				>
					<span className="colors__edit-wheel" />
					<span>
						Edit
						<br />
						colours
					</span>
				</button>
			</div>
		</RibbonGroup>
	)
}
