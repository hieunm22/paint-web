import { useTranslation } from "react-i18next"
import { NO_AUTOFILL } from "common/constant"
import { Icon } from "components/Icon"
import { Dialog } from "./Dialog"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useResizeSkewForm } from "../hooks"
import { closeDialog } from "store/slices/uiSlice"

/** Resize and Skew (Ctrl+W), over the selection when one is up. */
export function ResizeSkewDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const width = useAppSelector(s => s.doc.width)
	const height = useAppSelector(s => s.doc.height)
	const bounds = useAppSelector(s => s.selection.bounds)
	const form = useResizeSkewForm({
		width: bounds?.w ?? width,
		height: bounds?.h ?? height,
	})
	const percent = form.unit === "percent"

	return (
		<Dialog
			title={t("dialog.resize-skew.title")}
			width={318}
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
				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.resize-skew.resize")}
					</div>
					<div className="dialog__row">
						<span className="dialog__label">{t("dialog.resize-skew.by")}</span>
						<label>
							<input
								type="radio"
								name="unit"
								checked={percent}
								onChange={() => form.setUnit("percent")}
							/>{" "}
							{t("dialog.resize-skew.percentage")}
						</label>
						<label>
							<input
								type="radio"
								name="unit"
								checked={!percent}
								onChange={() => form.setUnit("pixels")}
							/>{" "}
							{t("dialog.resize-skew.pixels")}
						</label>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsH" size={11} />{" "}
							{t("dialog.resize-skew.horizontal")}
						</span>
						<input
							className="dialog__num"
							{...NO_AUTOFILL}
							type="number"
							min={1}
							value={form.horizontal}
							onChange={e => form.setHorizontal(Number(e.target.value))}
						/>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsV" size={11} />{" "}
							{t("dialog.resize-skew.vertical")}
						</span>
						<input
							className="dialog__num"
							{...NO_AUTOFILL}
							type="number"
							min={1}
							value={form.vertical}
							onChange={e => form.setVertical(Number(e.target.value))}
						/>
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="checkbox"
								checked={form.ratio}
								onChange={e => form.setRatio(e.target.checked)}
							/>{" "}
							{t("dialog.resize-skew.maintain-ratio")}
						</label>
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.resize-skew.skew")}
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsH" size={11} />{" "}
							{t("dialog.resize-skew.horizontal")}
						</span>
						<input
							className="dialog__num"
							{...NO_AUTOFILL}
							type="number"
							value={form.skewH}
							onChange={e => form.setSkewH(Number(e.target.value))}
						/>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsV" size={11} />{" "}
							{t("dialog.resize-skew.vertical")}
						</span>
						<input
							className="dialog__num"
							{...NO_AUTOFILL}
							type="number"
							value={form.skewV}
							onChange={e => form.setSkewV(Number(e.target.value))}
						/>
					</div>
					<div className="dialog__hint">{t("dialog.resize-skew.hint")}</div>
				</div>
			</div>
		</Dialog>
	)
}
