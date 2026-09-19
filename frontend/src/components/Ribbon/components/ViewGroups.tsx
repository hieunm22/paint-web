import { LargeButton, SmallButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setZoom, toggleView, zoomIn, zoomOut } from "store/slices/viewSlice"

/** View tab: Zoom, Show or hide, Display. */
export function ViewTabGroups() {
	const dispatch = useAppDispatch()
	const view = useAppSelector((s) => s.view)

	return (
		<>
			<RibbonGroup label="Zoom">
				<LargeButton
					label="Zoom in"
					icon="zoomIn"
					title="Zoom in (Ctrl+PgUp)"
					onClick={() => dispatch(zoomIn())}
				/>
				<LargeButton
					label="Zoom out"
					icon="zoomOut"
					title="Zoom out (Ctrl+PgDn)"
					onClick={() => dispatch(zoomOut())}
				/>
				<LargeButton
					label="100%"
					icon="zoom100"
					selected={view.zoom === 1}
					onClick={() => dispatch(setZoom(1))}
				/>
			</RibbonGroup>

			<RibbonGroup label="Show or hide">
				<ButtonStack>
					{/* rulers need zoom >= 1, gridlines need zoom >= 4. */}
					<SmallButton
						label="Rulers"
						icon={view.showRuler ? "checked" : "unchecked"}
						title="Rulers (Ctrl+R)"
						disabled={view.zoom < 1}
						onClick={() => dispatch(toggleView("showRuler"))}
					/>
					<SmallButton
						label="Gridlines"
						icon={view.showGrid ? "checked" : "unchecked"}
						title="Gridlines (Ctrl+G) - cần zoom >= 400%"
						disabled={view.zoom < 4}
						onClick={() => dispatch(toggleView("showGrid"))}
					/>
					<SmallButton
						label="Status bar"
						icon={view.showStatusBar ? "checked" : "unchecked"}
						onClick={() => dispatch(toggleView("showStatusBar"))}
					/>
				</ButtonStack>
			</RibbonGroup>

			<RibbonGroup label="Display">
				<LargeButton
					label="Full screen"
					icon="fullScreen"
					title="Full screen (F11)"
					selected={view.fullScreen}
					onClick={() => dispatch(toggleView("fullScreen"))}
				/>
				<LargeButton
					label="Thumbnail"
					icon="thumbnail"
					selected={view.showThumbnail}
					onClick={() => dispatch(toggleView("showThumbnail"))}
				/>
			</RibbonGroup>
		</>
	)
}
