import { useTranslation } from "react-i18next"
import { Menu, MenuItem } from "components/Menu"
import { SmallButton, SplitButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { tooltipWithShortcut } from "locales/common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { toggleMenu } from "store/slices/uiSlice"

/** Paste split button plus stacked Cut and Copy. */
export function ClipboardGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const open = useAppSelector((s) => s.ui.openMenu) === "paste"
	const hasSelection = useAppSelector((s) => s.selection.kind) !== "none"

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
				onToggleMenu={() => dispatch(toggleMenu("paste"))}
				menu={
					<Menu>
						<MenuItem
							label={t("ribbon.clipboard.paste")}
							icon="paste"
							shortcut={t("shortcut.edit.paste")}
						/>
						<MenuItem label={t("ribbon.clipboard.paste-from")} icon="open" />
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
				/>
				<SmallButton
					label={t("ribbon.clipboard.copy")}
					icon="copy"
					title={tooltipWithShortcut(
						"ribbon.clipboard.copy",
						"shortcut.edit.copy",
					)}
					disabled={!hasSelection}
				/>
			</ButtonStack>
		</RibbonGroup>
	)
}
