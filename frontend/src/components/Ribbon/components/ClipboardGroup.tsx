import { useTranslation } from "react-i18next"
import { Menu, MenuItem } from "components/Menu"
import { SmallButton, SplitButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { tooltipWithShortcut } from "locales/common"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { toggleMenu } from "store/slices/uiSlice"

/** Paste split button plus stacked Cut and Copy. */
export function ClipboardGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const open = useAppSelector(s => s.ui.openMenu) === "paste"
	const hasSelection = useAppSelector(s => s.selection.kind) !== "none"

	return (
		<RibbonGroup label={t("ribbon.clipboard.label")}>
			<SplitButton
				label={t("ribbon.clipboard.paste")}
				icon="paste"
				title={tooltipWithShortcut(
					"ribbon.clipboard.paste",
					"shortcut.edit.paste",
				)}
				open={open}
				onClick={() => void files.pasteImage()}
				onToggleMenu={() => dispatch(toggleMenu("paste"))}
				menu={
					<Menu>
						<MenuItem
							label={t("ribbon.clipboard.paste")}
							icon="paste"
							shortcut={t("shortcut.edit.paste")}
							onClick={() => void files.pasteImage()}
						/>
						<MenuItem
							label={t("ribbon.clipboard.paste-from")}
							icon="open"
							onClick={() => void files.pasteFrom()}
						/>
					</Menu>
				}
			/>
			<ButtonStack>
				<SmallButton
					label={t("ribbon.clipboard.cut")}
					icon="cut"
					title={tooltipWithShortcut(
						"ribbon.clipboard.cut",
						"shortcut.edit.cut",
					)}
					disabled={!hasSelection}
					onClick={() => void files.cutSelection()}
				/>
				<SmallButton
					label={t("ribbon.clipboard.copy")}
					icon="copy"
					title={tooltipWithShortcut(
						"ribbon.clipboard.copy",
						"shortcut.edit.copy",
					)}
					disabled={!hasSelection}
					onClick={() => void files.copySelection()}
				/>
			</ButtonStack>
		</RibbonGroup>
	)
}
