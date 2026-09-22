import { useTranslation } from "react-i18next"
import { SHEET_WIDTH } from "../constant"
import { Dialog } from "./Dialog"
import { sheetStyle, stampStyle } from "../common"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch } from "store/hooks"
import { usePrintPreview } from "../hooks"
import { closeDialog, openDialog } from "store/slices/uiSlice"

/** Print preview: the sheet Page setup describes, with the picture on it. */
export function PrintPreviewDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const { src, layout } = usePrintPreview()
	const scale = SHEET_WIDTH / layout.pageWidth

	return (
		<Dialog
			title={t("dialog.print-preview.title")}
			width={340}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={() => {
							dispatch(closeDialog())
							void files.print()
						}}
					>
						{t("dialog.print-preview.print")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => dispatch(openDialog("page-setup"))}
					>
						{t("dialog.print-preview.page-setup")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => dispatch(closeDialog())}
					>
						{t("dialog.common.close")}
					</button>
				</>
			}
		>
			<div className="dialog__body dialog__body--roomy">
				<div
					className="dialog__sheet"
					style={sheetStyle(layout, scale)}
					aria-label={t("dialog.print-preview.page")}
					role="img"
				>
					{src && (
						<img
							className="dialog__sheet-image"
							style={stampStyle(layout, scale)}
							src={src}
							alt=""
						/>
					)}
				</div>
				<div className="dialog__hint dialog__hint--flush">
					{t("dialog.print-preview.measure", {
						0: Math.round(layout.width),
						1: Math.round(layout.height),
						2: Math.round(layout.pageWidth),
						3: Math.round(layout.pageHeight),
					})}
				</div>
			</div>
		</Dialog>
	)
}
