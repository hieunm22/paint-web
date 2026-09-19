import {
	Menu,
	MenuAnchor,
	MenuItem,
	MenuSectionLabel,
	MenuSeparator,
} from "components/Menu"
import { SmallButton, SplitButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store"
import { toggleTransparent } from "store/slices/selectionSlice"
import { setTool } from "store/slices/toolSlice"
import { openDialog, toggleMenu } from "store/slices/uiSlice"

/** Select split button, Crop, Resize and Rotate. */
export function ImageGroup() {
	const dispatch = useAppDispatch()
	const openMenu = useAppSelector((s) => s.ui.openMenu)
	const selection = useAppSelector((s) => s.selection)
	const activeTool = useAppSelector((s) => s.tool.active)
	const hasSelection = selection.kind !== "none"

	return (
		<RibbonGroup label="Image">
			<SplitButton
				label="Select"
				icon="select"
				selected={activeTool === "select-rect" || activeTool === "select-free"}
				onClick={() => dispatch(setTool("select-rect"))}
				open={openMenu === "select"}
				onToggleMenu={() => dispatch(toggleMenu("select"))}
				menu={
					<Menu width={196}>
						<MenuSectionLabel>Selection shapes</MenuSectionLabel>
						<MenuItem
							label="Rectangular selection"
							checked={activeTool === "select-rect"}
							onClick={() => dispatch(setTool("select-rect"))}
						/>
						<MenuItem
							label="Free-form selection"
							checked={activeTool === "select-free"}
							onClick={() => dispatch(setTool("select-free"))}
						/>
						<MenuSeparator />
						<MenuSectionLabel>Selection options</MenuSectionLabel>
						<MenuItem label="Select all" shortcut="Ctrl+A" />
						<MenuItem
							label="Invert selection"
							shortcut="Ctrl+I"
							disabled={!hasSelection}
						/>
						<MenuItem label="Delete" shortcut="Del" disabled={!hasSelection} />
						<MenuItem
							label="Transparent selection"
							checked={selection.transparent}
							onClick={() => dispatch(toggleTransparent())}
						/>
					</Menu>
				}
			/>
			<ButtonStack>
				<SmallButton label="Crop" icon="crop" disabled={!hasSelection} />
				<SmallButton
					label="Resize"
					icon="resize"
					title="Resize and Skew (Ctrl+W)"
					onClick={() => dispatch(openDialog("resize-skew"))}
				/>
				<MenuAnchor>
					<SmallButton
						label="Rotate ▾"
						icon="rotate"
						onClick={() => dispatch(toggleMenu("rotate"))}
					/>
					{openMenu === "rotate" && (
						<Menu>
							<MenuItem label="Rotate right 90°" icon="redo" />
							<MenuItem label="Rotate left 90°" icon="undo" />
							<MenuItem label="Rotate 180°" icon="rotate" />
							<MenuSeparator />
							<MenuItem label="Flip vertical" />
							<MenuItem label="Flip horizontal" />
						</Menu>
					)}
				</MenuAnchor>
			</ButtonStack>
		</RibbonGroup>
	)
}
