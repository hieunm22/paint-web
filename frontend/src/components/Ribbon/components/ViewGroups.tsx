import { useTranslation } from "react-i18next"
import { LargeButton, SmallButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { tooltipWithShortcut } from "locales/common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import {
	setZoom,
	toggleView,
	zoomIn,
	zoomOut,
} from "store/slices/viewSlice"

/** View tab: Zoom, Show or hide, Display. */
export function ViewTabGroups() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const view = useAppSelector(s => s.view)

	return (
		<>
			<RibbonGroup label={t("ribbon.zoom.label")}>
				<LargeButton
					label={t("ribbon.zoom.in")}
					icon="zoomIn"
					title={tooltipWithShortcut("ribbon.zoom.in", "shortcut.view.zoom-in")}
					onClick={() => dispatch(zoomIn())}
				/>
				<LargeButton
					label={t("ribbon.zoom.out")}
					icon="zoomOut"
					title={tooltipWithShortcut(
						"ribbon.zoom.out",
						"shortcut.view.zoom-out",
					)}
					onClick={() => dispatch(zoomOut())}
				/>
				<LargeButton
					label={t("ribbon.zoom.actual")}
					icon="zoom100"
					selected={view.zoom === 1}
					onClick={() => dispatch(setZoom(1))}
				/>
			</RibbonGroup>

			<RibbonGroup label={t("ribbon.show-hide.label")}>
				<ButtonStack>
					{/* rulers need zoom >= 1, gridlines need zoom >= 4. */}
					<SmallButton
						label={t("ribbon.show-hide.rulers")}
						icon={view.showRuler ? "checked" : "unchecked"}
						title={tooltipWithShortcut(
							"ribbon.show-hide.rulers",
							"shortcut.view.rulers",
						)}
						disabled={view.zoom < 1}
						onClick={() => dispatch(toggleView("showRuler"))}
					/>
					<SmallButton
						label={t("ribbon.show-hide.gridlines")}
						icon={view.showGrid ? "checked" : "unchecked"}
						title={t("ribbon.show-hide.gridlines-tooltip")}
						disabled={view.zoom < 4}
						onClick={() => dispatch(toggleView("showGrid"))}
					/>
					<SmallButton
						label={t("ribbon.show-hide.status-bar")}
						icon={view.showStatusBar ? "checked" : "unchecked"}
						onClick={() => dispatch(toggleView("showStatusBar"))}
					/>
				</ButtonStack>
			</RibbonGroup>

			<RibbonGroup label={t("ribbon.display.label")}>
				<LargeButton
					label={t("ribbon.display.full-screen")}
					icon="fullScreen"
					title={tooltipWithShortcut(
						"ribbon.display.full-screen",
						"shortcut.view.full-screen",
					)}
					disabled
					selected={view.fullScreen}
					onClick={() => dispatch(toggleView("fullScreen"))}
				/>
				<LargeButton
					label={t("ribbon.display.thumbnail")}
					icon="thumbnail"
					selected={view.showThumbnail}
					onClick={() => dispatch(toggleView("showThumbnail"))}
				/>
			</RibbonGroup>
		</>
	)
}
