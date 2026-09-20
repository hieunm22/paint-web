import { useTranslation } from "react-i18next"
import { NO_AUTOFILL } from "common/constant"
import { useAppSelector } from "store/hooks"
import { Dialog } from "./Dialog"

/** image properties dialog (Ctrl+E). */
export function ImagePropertiesDialog() {
	const { t, i18n } = useTranslation()
	const doc = useAppSelector(s => s.doc)
	const sizeKB = Math.round((doc.width * doc.height * 3) / 1024)
	const savedAt = doc.savedAt
		? new Date(doc.savedAt).toLocaleString(i18n.language)
		: t("dialog.image-properties.not-available")

	return (
		<Dialog title={t("dialog.image-properties.title")} width={332}>
			<div className="dialog__body">
				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.file-attributes")}
					</div>
					<div className="dialog__kv">
						<span>{t("dialog.image-properties.last-saved")}</span>
						<span>{savedAt}</span>
						<span>{t("dialog.image-properties.size-on-disk")}</span>
						<span>
							{t("dialog.image-properties.size-estimate", { 0: sizeKB })}
						</span>
						<span>{t("dialog.image-properties.resolution")}</span>
						<span>{t("dialog.image-properties.dpi", { 0: doc.dpi })}</span>
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.units")}
					</div>
					<div className="dialog__row dialog__row--flush">
						<label>
							<input type="radio" name="units" />{" "}
							{t("dialog.image-properties.inches")}
						</label>
						<label>
							<input type="radio" name="units" />{" "}
							{t("dialog.image-properties.centimeters")}
						</label>
						<label>
							<input type="radio" name="units" defaultChecked />{" "}
							{t("dialog.image-properties.pixels")}
						</label>
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">
						{t("dialog.image-properties.colors")}
					</div>
					<div className="dialog__row dialog__row--flush">
						<label>
							<input type="radio" name="colors" />{" "}
							{t("dialog.image-properties.black-and-white")}
						</label>
						<label>
							<input type="radio" name="colors" defaultChecked />{" "}
							{t("dialog.image-properties.color")}
						</label>
					</div>
				</div>

				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">
						{t("dialog.image-properties.width")}
					</span>
					<input
						className="dialog__num"
						{...NO_AUTOFILL}
						defaultValue={doc.width}
					/>
					<span className="dialog__label dialog__label--short">
						{t("dialog.image-properties.height")}
					</span>
					<input
						className="dialog__num"
						{...NO_AUTOFILL}
						defaultValue={doc.height}
					/>
				</div>
			</div>
		</Dialog>
	)
}
