import { useState } from "react"
import { useAppDispatch } from "store"
import { addCustomColor, applyColor } from "store/slices/colorsSlice"
import { closeDialog } from "store/slices/uiSlice"
import type { NumFieldProps } from "../types"
import { BASIC_COLORS } from "../constant"
import { Dialog } from "./Dialog"

/**
 * recreates the classic Windows "Edit Colors" dialog.
 * Windows scales are Hue 0-239, Sat 0-240, Lum 0-240, not 0-360 and 0-100.
 */
export function EditColorsDialog() {
	const dispatch = useAppDispatch()
	const [hex, setHex] = useState("#000000")

	return (
		<Dialog
			title="Edit Colors"
			width={572}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--add-custom"
						onClick={() => dispatch(addCustomColor(hex))}
					>
						Add to Custom Colors
					</button>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={() => {
							dispatch(applyColor(hex))
							dispatch(closeDialog())
						}}
					>
						OK
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => dispatch(closeDialog())}
					>
						Cancel
					</button>
				</>
			}
		>
			<div className="dialog__edit-colors">
				<div>
					<div className="dialog__edit-colors-caption">Basic colors:</div>
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
							<div className="dialog__edit-colors-caption">Color|Solid:</div>
							<div
								className="dialog__preview"
								style={{ background: hex }}
							/>
						</div>
						<div>
							<NumField
								label="Hue:"
								value={160}
							/>
							<NumField
								label="Sat:"
								value={0}
							/>
							<NumField
								label="Lum:"
								value={0}
							/>
						</div>
						<div>
							<NumField
								label="Red:"
								value={0}
							/>
							<NumField
								label="Green:"
								value={0}
							/>
							<NumField
								label="Blue:"
								value={0}
							/>
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
			<input
				className="dialog__num dialog__num--narrow"
				defaultValue={value}
			/>
		</div>
	)
}
