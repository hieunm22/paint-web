import { useTranslation } from "react-i18next"
import { NO_AUTOFILL } from "common/constant"
import { BASIC_COLORS, HUE_MAX, LEVEL_MAX } from "../constant"
import { Dialog } from "./Dialog"
import { parseLevel } from "../common"
import { rgbaToHex, winHslToRgba } from "engine/color"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useEditColorsForm, useFieldPick } from "../hooks"
import { addCustomColor, applyColor } from "store/slices/colorsSlice"
import { closeDialog } from "store/slices/uiSlice"
import type { NumFieldProps } from "../types"

/**
 * recreates the classic Windows "Edit Colors" dialog, counting hue to 239 and
 * saturation and luminance to 240 so the numbers match the ones Paint shows.
 */
export function EditColorsDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const editing = useAppSelector(s => s.colors.editing)
	const current = useAppSelector(s => s.colors[editing])
	const form = useEditColorsForm(current)
	const { hsl, rgb, hex } = form

	const fieldProps = useFieldPick(form.pickTone)
	const barProps = useFieldPick((_across, down) => form.pickLevel(down))
	const pure = rgbaToHex(winHslToRgba({ h: hsl.h, s: hsl.s, l: LEVEL_MAX / 2 }))

	return (
		<Dialog
			title={t("dialog.edit-colors.title")}
			width={572}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--add-custom"
						onClick={() => dispatch(addCustomColor(hex))}
					>
						{t("dialog.edit-colors.add-custom")}
					</button>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={() => {
							dispatch(applyColor(hex))
							dispatch(closeDialog())
						}}
					>
						{t("dialog.common.ok")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => dispatch(closeDialog())}
					>
						{t("dialog.common.cancel")}
					</button>
				</>
			}
		>
			<div className="dialog__edit-colors">
				<div>
					<div className="dialog__edit-colors-caption">
						{t("dialog.edit-colors.basic")}
					</div>
					<div className="dialog__basic-grid">
						{BASIC_COLORS.map((color, i) => (
							<button
								key={`${color}-${i}`}
								type="button"
								className="dialog__basic-swatch"
								style={{ background: color }}
								title={color}
								aria-label={color}
								onClick={() => form.pick(color)}
							/>
						))}
					</div>
				</div>

				<div>
					<div className="dialog__hsl">
						<div className="dialog__hue-field" {...fieldProps}>
							<span
								className="dialog__hue-marker"
								style={{
									left: `${(hsl.h / HUE_MAX) * 100}%`,
									top: `${(1 - hsl.s / LEVEL_MAX) * 100}%`,
								}}
							/>
						</div>
						<div
							className="dialog__lum-bar"
							style={{
								background: `linear-gradient(to top, #000, ${pure}, #fff)`,
							}}
							{...barProps}
						>
							<span
								className="dialog__lum-marker"
								style={{ top: `${(1 - hsl.l / LEVEL_MAX) * 100}%` }}
							/>
						</div>
					</div>

					<div className="dialog__color-fields">
						<div>
							<div className="dialog__edit-colors-caption">
								{t("dialog.edit-colors.color-solid")}
							</div>
							<div className="dialog__preview" style={{ background: hex }} />
						</div>
						<div>
							<NumField
								label={t("dialog.edit-colors.hue")}
								value={hsl.h}
								max={HUE_MAX - 1}
								onChange={h => form.setHsl({ h })}
							/>
							<NumField
								label={t("dialog.edit-colors.sat")}
								value={hsl.s}
								max={LEVEL_MAX}
								onChange={s => form.setHsl({ s })}
							/>
							<NumField
								label={t("dialog.edit-colors.lum")}
								value={hsl.l}
								max={LEVEL_MAX}
								onChange={l => form.setHsl({ l })}
							/>
						</div>
						<div>
							<NumField
								label={t("dialog.edit-colors.red")}
								value={rgb.r}
								max={255}
								onChange={r => form.setRgb({ r })}
							/>
							<NumField
								label={t("dialog.edit-colors.green")}
								value={rgb.g}
								max={255}
								onChange={g => form.setRgb({ g })}
							/>
							<NumField
								label={t("dialog.edit-colors.blue")}
								value={rgb.b}
								max={255}
								onChange={b => form.setRgb({ b })}
							/>
						</div>
					</div>
				</div>
			</div>
		</Dialog>
	)
}

function NumField({
	label,
	value,
	max,
	onChange,
}: NumFieldProps) {
	return (
		<div className="dialog__num-field">
			<span className="dialog__num-field-label">{label}</span>
			<input
				className="dialog__num dialog__num--narrow"
				type="number"
				min={0}
				max={max}
				{...NO_AUTOFILL}
				value={value}
				onChange={e => onChange(parseLevel(e.target.value, value))}
			/>
		</div>
	)
}
