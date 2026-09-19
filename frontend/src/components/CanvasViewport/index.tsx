import { ResizeHandles, Ruler, Thumbnail } from "./components"
import { toolCursor, zoomedSize } from "./common"
import {
	useOverlayReset,
	usePointerTools,
	useSurface,
	useZoomFocus,
} from "./hooks"
import { useAppSelector } from "store/hooks"
import "./CanvasViewport.scss"

export function CanvasViewport() {
	const { width, height } = useAppSelector((s) => s.doc)
	const { zoom, showRuler, showGrid, showThumbnail } = useAppSelector(
		(s) => s.view,
	)
	const focus = useAppSelector((s) => s.view.focus)
	const activeTool = useAppSelector((s) => s.tool.active)
	const brushSize = useAppSelector((s) => s.tool.size)
	const bounds = useAppSelector((s) => s.selection.bounds)
	const { baseRef, previewRef, overlayRef, paneRef } = useSurface(width, height)
	const pointerProps = usePointerTools(zoom, paneRef)
	const viewportRef = useZoomFocus(focus)
	useOverlayReset(activeTool)

	// rulers need zoom >= 1, gridlines need zoom >= 4.
	const rulerOn = showRuler && zoom >= 1
	const gridOn = showGrid && zoom >= 4
	const layerSize = zoomedSize(width, height, zoom)
	const cursor = toolCursor(activeTool, brushSize, zoom)

	return (
		<div className="canvas">
			{rulerOn ? <div className="canvas__corner" /> : <div />}
			{rulerOn ? <Ruler orientation="h" length={width} zoom={zoom} /> : <div />}
			{rulerOn ? (
				<Ruler orientation="v" length={height} zoom={zoom} />
			) : (
				<div />
			)}

			<div className="canvas__pane" ref={paneRef}>
				<div className="canvas__viewport" ref={viewportRef}>
					<div className="canvas__stage">
						<div className="canvas__frame" style={{ ...layerSize, cursor }}>
							<canvas
								ref={baseRef}
								className="canvas__surface"
								style={layerSize}
							/>
							<canvas
								ref={previewRef}
								className="canvas__surface canvas__surface--preview"
								style={layerSize}
								{...pointerProps}
							/>

							{gridOn && (
								<div
									className="canvas__grid"
									style={{ backgroundSize: `${zoom}px ${zoom}px` }}
								/>
							)}

							{bounds && (
								<div
									className="canvas__ants"
									style={{
										left: bounds.x * zoom,
										top: bounds.y * zoom,
										width: bounds.w * zoom,
										height: bounds.h * zoom,
									}}
								/>
							)}

							<ResizeHandles />
						</div>
					</div>
				</div>

				<canvas ref={overlayRef} className="canvas__overlay" />

				{showThumbnail && <Thumbnail />}
			</div>
		</div>
	)
}
