import { useTranslation } from "react-i18next"
import { ZOOM_STEPS } from "common/constant"
import { CELL_ICONS } from "./constant"
import { StatusCell, ZoomControl } from "./components"
import { formatFileSize, formatZoomPercent, zoomStepIndex } from "./common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useCursorPosition, useEncodedSize, useSelectionBox } from "./hooks"
import { setZoom, zoomIn, zoomOut } from "store/slices/viewSlice"
import "./StatusBar.scss"

/** four info cells plus the zoom slider on the right. */
export function StatusBar() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const doc = useAppSelector((s) => s.doc)
	const zoom = useAppSelector((s) => s.view.zoom)
	const cursor = useCursorPosition()
	const bounds = useSelectionBox()
	const bytes = useEncodedSize()

	return (
		<div className="status-bar">
			<StatusCell icon={CELL_ICONS.cursor}>
				{cursor
					? t("statusbar.cell.cursor-position", { 0: cursor.x, 1: cursor.y })
					: ""}
			</StatusCell>
			<StatusCell icon={CELL_ICONS.selection}>
				{bounds
					? t("statusbar.cell.selection-size", { 0: bounds.w, 1: bounds.h })
					: ""}
			</StatusCell>
			<StatusCell icon={CELL_ICONS.document}>
				{t("statusbar.cell.document-size", { 0: doc.width, 1: doc.height })}
			</StatusCell>
			<StatusCell icon={CELL_ICONS.fileSize}>
				{bytes === null ? "" : formatFileSize(bytes)}
			</StatusCell>

			<span className="status-bar__spacer" />

			<ZoomControl
				zoom={zoom}
				stepIndex={zoomStepIndex(zoom, ZOOM_STEPS)}
				maxIndex={ZOOM_STEPS.length - 1}
				label={formatZoomPercent(zoom)}
				onStep={(i) => dispatch(setZoom(ZOOM_STEPS[i]))}
				onZoomIn={() => dispatch(zoomIn())}
				onZoomOut={() => dispatch(zoomOut())}
			/>
		</div>
	)
}
