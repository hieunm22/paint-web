import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BASIC_COLORS } from "../constant"
import { useAppDispatch } from "store/hooks"
import { addCustomColor, applyColor } from "store/slices/colorsSlice"
import { closeDialog } from "store/slices/uiSlice"
import type { NumFieldProps } from "../types"
import { Dialog } from "./Dialog"

/**
 * recreates the classic Windows "Edit Colors" dialog.
 */
export function EditColorsDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const [hex, setHex] = useState("#000000")

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
								onClick={() => setHex(color)}
							/>
						))}
					</div>
				</div>

				<div>
					<div className="dialog__hsl">
						<div className="dialog__hue-field" />
						<div className="dialog__lum-bar" />
					</div>

					<div className="dialog__color-fields">
						<div>
							<div className="dialog__edit-colors-caption">
								{t("dialog.edit-colors.color-solid")}
							</div>
							<div className="dialog__preview" style={{ background: hex }} />
						</div>
						<div>
							<NumField label={t("dialog.edit-colors.hue")} value={160} />
							<NumField label={t("dialog.edit-colors.sat")} value={0} />
							<NumField label={t("dialog.edit-colors.lum")} value={0} />
						</div>
						<div>
							<NumField label={t("dialog.edit-colors.red")} value={0} />
							<NumField label={t("dialog.edit-colors.green")} value={0} />
							<NumField label={t("dialog.edit-colors.blue")} value={0} />
						</div>
					</div>
				</div>
			</div>
		</Dialog>
	)
}

function NumField({ label, value }: NumFieldProps) {
	return (
		<div className="dialog__num-field">
			<span className="dialog__num-field-label">{label}</span>
			<input className="dialog__num dialog__num--narrow" defaultValue={value} />
		</div>
	)
}
