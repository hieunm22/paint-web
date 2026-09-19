import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { Dialog } from "./Dialog"

/** Resize and Skew dialog (Ctrl+W). */
export function ResizeSkewDialog() {
	const { t } = useTranslation()
	const [unit, setUnit] = useState<"percent" | "pixels">("percent")
	const [ratio, setRatio] = useState(true)

	return (
		<Dialog title={t("dialog.resize-skew.title")} width={318}>
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
								checked={unit === "percent"}
								onChange={() => setUnit("percent")}
							/>{" "}
							{t("dialog.resize-skew.percentage")}
						</label>
						<label>
							<input
								type="radio"
								name="unit"
								checked={unit === "pixels"}
								onChange={() => setUnit("pixels")}
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
							defaultValue={unit === "percent" ? 100 : 1152}
						/>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsV" size={11} />{" "}
							{t("dialog.resize-skew.vertical")}
						</span>
						<input
							className="dialog__num"
							defaultValue={unit === "percent" ? 100 : 648}
						/>
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="checkbox"
								checked={ratio}
								onChange={(e) => setRatio(e.target.checked)}
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
						<input className="dialog__num" defaultValue={0} />
					</div>
					<div className="dialog__row">
						<span className="dialog__label">
							<Icon name="arrowsV" size={11} />{" "}
							{t("dialog.resize-skew.vertical")}
						</span>
						<input className="dialog__num" defaultValue={0} />
					</div>
					<div className="dialog__hint">{t("dialog.resize-skew.hint")}</div>
				</div>
			</div>
		</Dialog>
	)
}
