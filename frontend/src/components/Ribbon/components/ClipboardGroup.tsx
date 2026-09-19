import { Menu, MenuItem } from "components/Menu"
import { SmallButton, SplitButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store"
import { toggleMenu } from "store/slices/uiSlice"

/** Paste split button plus stacked Cut and Copy. */
export function ClipboardGroup() {
	const dispatch = useAppDispatch()
	const open = useAppSelector((s) => s.ui.openMenu) === "paste"
	const hasSelection = useAppSelector((s) => s.selection.kind) !== "none"

	return (
		<RibbonGroup label="Clipboard">
			<SplitButton
				label="Paste"
				icon="paste"
				title="Paste (Ctrl+V)"
				open={open}
				onToggleMenu={() => dispatch(toggleMenu("paste"))}
				menu={
					<Menu>
						<MenuItem label="Paste" icon="paste" shortcut="Ctrl+V" />
						<MenuItem label="Paste from…" icon="open" />
					</Menu>
				}
			/>
			<ButtonStack>
				<SmallButton
					label="Cut"
					icon="cut"
					title="Cut (Ctrl+X)"
					disabled={!hasSelection}
				/>
				<SmallButton
					label="Copy"
					icon="copy"
					title="Copy (Ctrl+C)"
					disabled={!hasSelection}
				/>
			</ButtonStack>
		</RibbonGroup>
	)
}
