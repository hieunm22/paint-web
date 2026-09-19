import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FORMAT_HINT_KEYS, SAVE_FORMATS } from "../constant"
import { documentName } from "store/common"
import { useAppSelector } from "store/hooks"
import type { ImageFormat } from "store/types"
import { Dialog } from "./Dialog"

/** fallback for browsers without the File System Access API. */
export function SaveAsDialog() {
	const { t } = useTranslation()
	const fileName = useAppSelector((s) => s.doc.fileName)
	const [format, setFormat] = useState<ImageFormat>("png")
	const lossy = format === "jpeg" || format === "webp"

	return (
		<Dialog title={t("dialog.save-as.title")} width={396}>
			<div className="dialog__body">
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">{t("dialog.save-as.file-name")}</span>
					<input
						className="dialog__num dialog__num--wide"
						defaultValue={documentName(fileName)}
					/>
				</div>
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">{t("dialog.save-as.type")}</span>
					<select
						className="dialog__select"
						value={format}
						onChange={(e) => setFormat(e.target.value as ImageFormat)}
					>
						{SAVE_FORMATS.map((f) => (
							<option key={f.id} value={f.id}>
								{t("dialog.save-as.format-option", { 0: f.name, 1: f.ext })}
							</option>
						))}
					</select>
				</div>
				{lossy && (
					<div className="dialog__row dialog__row--flush">
						<span className="dialog__label">{t("dialog.save-as.quality")}</span>
						<input
							type="range"
							min={10}
							max={100}
							defaultValue={92}
							className="dialog__range"
						/>
					</div>
				)}
				<div className="dialog__hint dialog__hint--flush">
					{t(FORMAT_HINT_KEYS[format])}
				</div>
			</div>
		</Dialog>
	)
}
