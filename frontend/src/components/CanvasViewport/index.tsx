import { zoomedSize } from "./common"
import { useCursorReadout, useSurface } from "./hooks"
import { useAppSelector } from "store"
import { ResizeHandles, Ruler, Thumbnail } from "./components"
import { TOOL_CURSORS } from "./constant"
import "./CanvasViewport.scss"

export function CanvasViewport() {
	const { width, height } = useAppSelector((s) => s.doc)
	const { zoom, showRuler, showGrid, showThumbnail } = useAppSelector(
		(s) => s.view,
	)
	const activeTool = useAppSelector((s) => s.tool.active)
	const bounds = useAppSelector((s) => s.selection.bounds)
	const { baseRef, previewRef, overlayRef, paneRef } = useSurface(width, height)
	const cursorProps = useCursorReadout(zoom)

	// rulers need zoom >= 1, gridlines need zoom >= 4.
	const rulerOn = showRuler && zoom >= 1
	const gridOn = showGrid && zoom >= 4
	const layerSize = zoomedSize(width, height, zoom)

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
				<div className="canvas__viewport">
					<div className="canvas__stage">
						<div
							className="canvas__frame"
							style={{ ...layerSize, cursor: TOOL_CURSORS[activeTool] }}
						>
							<canvas
								ref={baseRef}
								className="canvas__surface"
								style={layerSize}
							/>
							<canvas
								ref={previewRef}
								className="canvas__surface canvas__surface--preview"
								style={layerSize}
								{...cursorProps}
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
