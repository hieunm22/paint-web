import { useTranslation } from "react-i18next"
import { TOOL_CURSORS } from "./constant"
import {
	ResizeHandles,
	Ruler,
	TextBox,
	Thumbnail,
} from "./components"
import {
	lassoPoints,
	overlayBox,
	overlayGrip,
	zoomedSize,
} from "./common"
import { useAppSelector } from "store/hooks"
import {
	useOverlayReset,
	useOverlayState,
	usePointerTools,
	useSurface,
	useVirtualView,
	useZoomFocus,
} from "./hooks"
import "./CanvasViewport.scss"

export function CanvasViewport() {
	const { t } = useTranslation()
	const { width, height } = useAppSelector(s => s.doc)
	const {
		zoom,
		showRuler,
		showGrid,
		showThumbnail,
	} = useAppSelector(
		s => s.view,
	)
	const focus = useAppSelector(s => s.view.focus)
	const activeTool = useAppSelector(s => s.tool.active)
	const overlay = useOverlayState()
	const {
		baseRef,
		previewRef,
		overlayRef,
		paneRef,
	} = useSurface(width, height)
	const pointerProps = usePointerTools(zoom, paneRef, previewRef)
	const viewportRef = useZoomFocus(focus)
	useVirtualView(viewportRef, zoom)
	useOverlayReset(activeTool)

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
				<div className="canvas__viewport" ref={viewportRef}>
					<div className="canvas__stage">
						<div
							className="canvas__frame"
							style={{ ...layerSize, cursor: TOOL_CURSORS[activeTool] }}
						>
							<canvas
								ref={baseRef}
								className="canvas__surface"
								role="img"
								aria-label={t("canvas.surface.label", {
									0: width,
									1: height,
								})}
							/>
							<canvas
								ref={previewRef}
								className="canvas__surface canvas__surface--preview"
								{...pointerProps}
							/>

							{gridOn && (
								<div
									className="canvas__grid"
									style={{ backgroundSize: `${zoom}px ${zoom}px` }}
								/>
							)}

							{overlay.lasso ? (
								<svg
									className="canvas__lasso"
									width={layerSize.width}
									height={layerSize.height}
								>
									<polygon
										className="canvas__lasso-base"
										points={lassoPoints(overlay.lasso, zoom)}
									/>
									<polygon
										className="canvas__lasso-ants"
										points={lassoPoints(overlay.lasso, zoom)}
									/>
								</svg>
							) : (
								overlay.selection && (
									<div
										className="canvas__ants"
										style={overlayBox(overlay.selection, zoom)}
									/>
								)
							)}

							{overlay.draft?.bounds && (
								<div
									className="canvas__draft"
									style={overlayBox(overlay.draft.bounds, zoom)}
								/>
							)}

							{overlay.draft?.handles.map((handle, i) => (
								<span
									// the position repeats while a shape is still a point
									key={i}
									className="canvas__grip"
									style={overlayGrip(handle, zoom)}
								/>
							))}

							{overlay.grips?.map((handle, i) => (
								<span
									key={i}
									className="canvas__grip"
									style={overlayGrip(handle, zoom)}
								/>
							))}

							{overlay.text && <TextBox box={overlay.text} zoom={zoom} />}

							<ResizeHandles doc={{ width, height }} zoom={zoom} />
						</div>
					</div>
				</div>

				<canvas ref={overlayRef} className="canvas__overlay" />

				{showThumbnail && (
					<Thumbnail
						doc={{ width, height }}
						zoom={zoom}
						scrollRef={viewportRef}
					/>
				)}
			</div>
		</div>
	)
}
