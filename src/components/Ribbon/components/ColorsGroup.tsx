import { useTranslation } from "react-i18next"
import { RibbonGroup } from "components/RibbonGroup"
import { ColorSlot } from "./ColorSlot"
import { Swatch } from "./Swatch"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setEditingSwatch } from "store/slices/colorsSlice"
import { openDialog } from "store/slices/uiSlice"

/** Color 1 and 2, the 20 standard swatches, 10 custom slots and Edit colors. */
export function ColorsGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const {
		color1,
		color2,
		editing,
		palette,
		custom,
	} = useAppSelector(
		s => s.colors,
	)

	return (
		<RibbonGroup label={t("ribbon.colors.label")}>
			<div className="colors">
				<ColorSlot
					label={t("ribbon.colors.color1")}
					hex={color1}
					editing={editing === "color1"}
					onClick={() => dispatch(setEditingSwatch("color1"))}
				/>
				<ColorSlot
					label={t("ribbon.colors.color2")}
					hex={color2}
					editing={editing === "color2"}
					onClick={() => dispatch(setEditingSwatch("color2"))}
				/>

				<div className="colors__palette">
					{palette.map(hex => (
						<Swatch key={hex} hex={hex} label={hex} />
					))}
					{custom.map((hex, i) => (
						<Swatch
							key={i}
							hex={hex}
							label={hex ?? t("ribbon.colors.custom-empty")}
						/>
					))}
				</div>

				<button
					type="button"
					className="colors__edit"
					onClick={() => dispatch(openDialog("edit-colors"))}
				>
					<span className="colors__edit-wheel" />
					<span>{t("ribbon.colors.edit")}</span>
				</button>
			</div>
		</RibbonGroup>
	)
}
