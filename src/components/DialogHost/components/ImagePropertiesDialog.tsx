import { useTranslation } from "react-i18next"
import { NO_AUTOFILL } from "common/constant"
import { COLOR_MODE_OPTIONS, UNIT_OPTIONS, UNIT_STEP } from "../constant"
import { Dialog } from "./Dialog"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useImagePropertiesForm } from "../hooks"
import { closeDialog } from "store/slices/uiSlice"

/** image properties dialog (Ctrl+E). */
export function ImagePropertiesDialog() {
	const { t, i18n } = useTranslation()
	const dispatch = useAppDispatch()
	const width = useAppSelector(s => s.doc.width)
	const height = useAppSelector(s => s.doc.height)
	const dpi = useAppSelector(s => s.doc.dpi)
	const savedAt = useAppSelector(s => s.doc.savedAt)
	const monochrome = useAppSelector(s => s.doc.monochrome)
	const size = { width, height }
	const form = useImagePropertiesForm(size, dpi, monochrome)
	const sizeKB = Math.round((width * height * 3) / 1024)
	const saved = savedAt
		? new Date(savedAt).toLocaleString(i18n.language)
		: t("dialog.image-properties.not-available")

	return (
		<Dialog
			title={t("dialog.image-properties.title")}
			width={332}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={form.apply}
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
			<div className="dialog__body">
				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.file-attributes")}
					</div>
					<div className="dialog__kv">
						<span>{t("dialog.image-properties.last-saved")}</span>
						<span>{saved}</span>
						<span>{t("dialog.image-properties.size-on-disk")}</span>
						<span>
							{t("dialog.image-properties.size-estimate", { 0: sizeKB })}
						</span>
						<span>{t("dialog.image-properties.resolution")}</span>
						<span>{t("dialog.image-properties.dpi", { 0: dpi })}</span>
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.units")}
					</div>
					<div className="dialog__row dialog__row--flush">
						{UNIT_OPTIONS.map(option => (
							<label key={option.id}>
								<input
									type="radio"
									name="units"
									checked={form.unit === option.id}
									onChange={() => form.setUnit(option.id)}
								/>{" "}
								{t(option.labelKey)}
							</label>
						))}
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.colors")}
					</div>
					<div className="dialog__row dialog__row--flush">
						{COLOR_MODE_OPTIONS.map(option => (
							<label key={option.id}>
								<input
									type="radio"
									name="colors"
									checked={form.colors === option.id}
									onChange={() => form.setColors(option.id)}
								/>{" "}
								{t(option.labelKey)}
							</label>
						))}
					</div>
				</div>

				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">
						{t("dialog.image-properties.width")}
					</span>
					<input
						className="dialog__num"
						{...NO_AUTOFILL}
						type="number"
						min={UNIT_STEP[form.unit]}
						step={UNIT_STEP[form.unit]}
						value={form.width}
						onChange={e => form.setWidth(Number(e.target.value))}
					/>
					<span className="dialog__label dialog__label--short">
						{t("dialog.image-properties.height")}
					</span>
					<input
						className="dialog__num"
						{...NO_AUTOFILL}
						type="number"
						min={UNIT_STEP[form.unit]}
						step={UNIT_STEP[form.unit]}
						value={form.height}
						onChange={e => form.setHeight(Number(e.target.value))}
					/>
				</div>
			</div>
		</Dialog>
	)
}
