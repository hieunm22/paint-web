import { useTranslation } from "react-i18next"
import { EXTENSIONS, FORMATS, NO_AUTOFILL } from "common/constant"
import { FORMAT_HINT_KEYS } from "../constant"
import { Dialog } from "./Dialog"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useSaveAsForm } from "../hooks"
import { closeDialog } from "store/slices/uiSlice"
import type { ImageFormat } from "types/store.types"

/** name, format and quality in one place, then straight on to the save picker. */
export function SaveAsDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const fileName = useAppSelector(s => s.doc.fileName)
	const docFormat = useAppSelector(s => s.doc.format)
	const form = useSaveAsForm(fileName, docFormat)
	const lossy = form.format === "jpeg" || form.format === "webp"

	const confirm = () => {
		dispatch(closeDialog())
		void files.saveAs(form.format, {
			fileName: form.name,
			quality: form.quality / 100,
		})
	}

	return (
		<Dialog
			title={t("dialog.save-as.title")}
			width={396}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={confirm}
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
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">{t("dialog.save-as.file-name")}</span>
					<input
						className="dialog__num dialog__num--wide"
						{...NO_AUTOFILL}
						value={form.name}
						onChange={e => form.setName(e.target.value)}
					/>
				</div>
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">{t("dialog.save-as.type")}</span>
					<select
						className="dialog__select"
						value={form.format}
						onChange={e => form.setFormat(e.target.value as ImageFormat)}
					>
						{FORMATS.map(format => (
							<option key={format} value={format}>
								{t("dialog.save-as.format-option", {
									0: format.toUpperCase(),
									1: EXTENSIONS[format],
								})}
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
							value={form.quality}
							onChange={e => form.setQuality(Number(e.target.value))}
							className="dialog__range"
						/>
					</div>
				)}
				<div className="dialog__hint dialog__hint--flush">
					{t(FORMAT_HINT_KEYS[form.format])}
				</div>
			</div>
		</Dialog>
	)
}
