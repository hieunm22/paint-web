import { useTranslation } from "react-i18next"
import {
	Menu,
	MenuAnchor,
	MenuItem,
	MenuSectionLabel,
	MenuSeparator,
} from "components/Menu"
import { SmallButton, SplitButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
import { tooltipWithShortcut } from "locales/common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { toggleTransparent } from "store/slices/selectionSlice"
import { setTool } from "store/slices/toolSlice"
import { openDialog, toggleMenu } from "store/slices/uiSlice"

/** Select split button, Crop, Resize and Rotate. */
export function ImageGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const openMenu = useAppSelector((s) => s.ui.openMenu)
	const selection = useAppSelector((s) => s.selection)
	const activeTool = useAppSelector((s) => s.tool.active)
	const hasSelection = selection.kind !== "none"
	const canSelect = Boolean(IMPLEMENTED["select-rect"])

	return (
		<RibbonGroup label={t("ribbon.image.label")}>
			<SplitButton
				label={t("ribbon.image.select")}
				icon="select"
				selected={activeTool === "select-rect" || activeTool === "select-free"}
				disabled={!canSelect}
				onClick={() => dispatch(setTool("select-rect"))}
				open={openMenu === "select"}
				onToggleMenu={() => dispatch(toggleMenu("select"))}
				menu={
					<Menu width={196}>
						<MenuSectionLabel>
							{t("ribbon.image.selection-shapes")}
						</MenuSectionLabel>
						<MenuItem
							label={t("ribbon.image.select-rect")}
							checked={activeTool === "select-rect"}
							onClick={() => dispatch(setTool("select-rect"))}
						/>
						<MenuItem
							label={t("ribbon.image.select-free")}
							checked={activeTool === "select-free"}
							onClick={() => dispatch(setTool("select-free"))}
						/>
						<MenuSeparator />
						<MenuSectionLabel>
							{t("ribbon.image.selection-options")}
						</MenuSectionLabel>
						<MenuItem
							label={t("ribbon.image.select-all")}
							shortcut={t("shortcut.image.select-all")}
						/>
						<MenuItem
							label={t("ribbon.image.invert-selection")}
							shortcut={t("shortcut.image.invert-selection")}
							disabled={!hasSelection}
						/>
						<MenuItem
							label={t("ribbon.image.delete")}
							shortcut={t("shortcut.image.delete")}
							disabled={!hasSelection}
						/>
						<MenuItem
							label={t("ribbon.image.transparent-selection")}
							checked={selection.transparent}
							onClick={() => dispatch(toggleTransparent())}
						/>
					</Menu>
				}
			/>
			<ButtonStack>
				<SmallButton
					label={t("ribbon.image.crop")}
					icon="crop"
					disabled={!hasSelection}
				/>
				<SmallButton
					label={t("ribbon.image.resize")}
					icon="resize"
					title={tooltipWithShortcut(
						"dialog.resize-skew.title",
						"shortcut.image.resize",
					)}
					disabled
					onClick={() => dispatch(openDialog("resize-skew"))}
				/>
				<MenuAnchor>
					<SmallButton
						label={t("ribbon.image.rotate")}
						icon="rotate"
						caret
						disabled
						onClick={() => dispatch(toggleMenu("rotate"))}
					/>
					{openMenu === "rotate" && (
						<Menu>
							<MenuItem label={t("ribbon.image.rotate-right")} icon="redo" />
							<MenuItem label={t("ribbon.image.rotate-left")} icon="undo" />
							<MenuItem label={t("ribbon.image.rotate-180")} icon="rotate" />
							<MenuSeparator />
							<MenuItem label={t("ribbon.image.flip-vertical")} />
							<MenuItem label={t("ribbon.image.flip-horizontal")} />
						</Menu>
					)}
				</MenuAnchor>
			</ButtonStack>
		</RibbonGroup>
	)
}
