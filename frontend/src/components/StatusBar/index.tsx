import { estimateFileSize, formatZoomPercent, zoomStepIndex } from "./common"
import { useCursorPosition } from "./hooks"
import { useAppDispatch, useAppSelector } from "store"
import { setZoom, ZOOM_STEPS, zoomIn, zoomOut } from "store/slices/viewSlice"
import { StatusCell, ZoomControl } from "./components"
import { CELL_ICONS } from "./constant"
import "./StatusBar.scss"

/** four info cells plus the zoom slider on the right. */
export function StatusBar() {
	const dispatch = useAppDispatch()
	const doc = useAppSelector((s) => s.doc)
	const bounds = useAppSelector((s) => s.selection.bounds)
	const zoom = useAppSelector((s) => s.view.zoom)
	const cursor = useCursorPosition()

	return (
		<div className="status-bar">
			<StatusCell icon={CELL_ICONS.cursor}>
				{cursor ? `${cursor.x}, ${cursor.y}px` : ""}
			</StatusCell>
			<StatusCell icon={CELL_ICONS.selection}>
				{bounds ? `${bounds.w} × ${bounds.h}px` : ""}
			</StatusCell>
			<StatusCell icon={CELL_ICONS.document}>
				{doc.width} × {doc.height}px
			</StatusCell>
			<StatusCell icon={CELL_ICONS.fileSize}>
				{estimateFileSize(doc.width, doc.height)}
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
