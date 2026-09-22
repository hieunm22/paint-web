import { useTranslation } from "react-i18next"
import { MAX_MARGIN, MAX_PRINT_SCALE, NO_AUTOFILL } from "common/constant"
import { MARGIN_FIELDS, ORIENTATION_OPTIONS, PAPER_OPTIONS } from "../constant"
import { Dialog } from "./Dialog"
import { useAppDispatch, useAppSelector } from "store/hooks"
import {
	setCentering,
	setFit,
	setMargin,
	setOrientation,
	setPaper,
	setScale,
} from "store/slices/printSlice"
import { closeDialog } from "store/slices/uiSlice"
import type { PaperSize } from "types/store.types"

/** Page setup: what the print stylesheet is written from. */
export function PageSetupDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const setup = useAppSelector(s => s.print)

	return (
		<Dialog
			title={t("dialog.page-setup.title")}
			width={332}
			footer={
				<button
					type="button"
					className="dialog__btn dialog__btn--primary"
					onClick={() => dispatch(closeDialog())}
				>
					{t("dialog.common.ok")}
				</button>
			}
		>
			<div className="dialog__body">
				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.page-setup.paper")}
					</div>
					<div className="dialog__row">
						<span className="dialog__label">{t("dialog.page-setup.size")}</span>
						<select
							className="dialog__select"
							value={setup.paper}
							onChange={e => dispatch(setPaper(e.target.value as PaperSize))}
						>
							{PAPER_OPTIONS.map(paper => (
								<option key={paper.id} value={paper.id}>
									{t(paper.labelKey)}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.page-setup.orientation")}
					</div>
					<div className="dialog__row">
						{ORIENTATION_OPTIONS.map(option => (
							<label key={option.id}>
								<input
									type="radio"
									name="orientation"
									checked={setup.orientation === option.id}
									onChange={() => dispatch(setOrientation(option.id))}
								/>{" "}
								{t(option.labelKey)}
							</label>
						))}
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.page-setup.margins")}
					</div>
					<div className="dialog__row dialog__row--flush">
						{MARGIN_FIELDS.map(field => (
							<label key={field.edge} className="dialog__num-field">
								<span className="dialog__num-field-label">
									{t(field.labelKey)}
								</span>
								<input
									className="dialog__num dialog__num--narrow"
									{...NO_AUTOFILL}
									type="number"
									min={0}
									max={MAX_MARGIN}
									value={setup.margins[field.edge]}
									onChange={e =>
										dispatch(
											setMargin({
												edge: field.edge,
												value: Number(e.target.value),
											}),
										)
									}
								/>
							</label>
						))}
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.page-setup.centering")}
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="checkbox"
								checked={setup.centerH}
								onChange={e =>
									dispatch(
										setCentering({ axis: "centerH", on: e.target.checked }),
									)
								}
							/>{" "}
							{t("dialog.page-setup.horizontal")}
						</label>
						<label>
							<input
								type="checkbox"
								checked={setup.centerV}
								onChange={e =>
									dispatch(
										setCentering({ axis: "centerV", on: e.target.checked }),
									)
								}
							/>{" "}
							{t("dialog.page-setup.vertical")}
						</label>
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">
						{t("dialog.page-setup.scaling")}
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="radio"
								name="scaling"
								checked={setup.fit}
								onChange={() => dispatch(setFit(true))}
							/>{" "}
							{t("dialog.page-setup.fit")}
						</label>
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="radio"
								name="scaling"
								checked={!setup.fit}
								onChange={() => dispatch(setFit(false))}
							/>{" "}
							{t("dialog.page-setup.adjust")}
						</label>
						<input
							className="dialog__num dialog__num--narrow"
							{...NO_AUTOFILL}
							type="number"
							min={1}
							max={MAX_PRINT_SCALE}
							disabled={setup.fit}
							value={setup.scale}
							onChange={e => dispatch(setScale(Number(e.target.value)))}
						/>
						<span className="dialog__label dialog__label--short">
							{t("dialog.page-setup.percent")}
						</span>
					</div>
					<div className="dialog__hint">{t("dialog.page-setup.hint")}</div>
				</div>
			</div>
		</Dialog>
	)
}
