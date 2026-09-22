import type { Meta, StoryObj } from "@storybook/react-vite"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { expect, screen, waitFor } from "storybook/test"
import {
	Menu,
	MenuAnchor,
	MenuItem,
	MenuSectionLabel,
	MenuSeparator,
} from "components/Menu"
import { SmallButton } from "components/RibbonButton"
import { shortcutText } from "locales/common"

const meta = {
	title: "Components/Menu",
	component: Menu,
	// each story builds its own menu; the args are only what the type asks
	args: { children: null },
	parameters: { layout: "padded", controls: { disable: true } },
} satisfies Meta<typeof Menu>

export default meta

/**
 * the menu portals into document.body and places itself under its anchor, which
 * is why a story wraps it in one.
 */
export const Default: StoryObj<typeof meta> = {
	render: () => <SelectionMenu />,
	play: async () => {
		await waitFor(() => {
			const menu = screen.getByRole("menu")
			expect(menu).toBeInTheDocument()
		})
	},
}

/** the two marks a menu draws: one of a set, and a switch standing alone. */
export const Marks: StoryObj<typeof meta> = { render: () => <ViewMenu /> }

function SelectionMenu() {
	const { t } = useTranslation()
	const open = useOpenAfterMount()

	return (
		<MenuAnchor>
			<SmallButton label={t("ribbon.image.select")} icon="select" caret />
			{open && (
				<Menu width={220}>
					<MenuSectionLabel>
						{t("ribbon.image.selection-shapes")}
					</MenuSectionLabel>
					<MenuItem label={t("ribbon.image.select-rect")} icon="select" />
					<MenuItem label={t("ribbon.image.select-free")} icon="select" />
					<MenuSeparator />
					<MenuItem
						label={t("ribbon.image.select-all")}
						shortcut={shortcutText("shortcut.image.select-all")}
					/>
					<MenuItem
						label={t("ribbon.image.invert-selection")}
						shortcut={shortcutText("shortcut.image.invert-selection")}
					/>
					<MenuItem label={t("ribbon.image.delete")} disabled />
					<MenuSeparator />
					<MenuItem label={t("ribbon.image.rotate")} submenu />
				</Menu>
			)}
		</MenuAnchor>
	)
}

function ViewMenu() {
	const { t } = useTranslation()
	const open = useOpenAfterMount()

	return (
		<MenuAnchor>
			<SmallButton label={t("ribbon.show-hide.label")} icon="rulers" caret />
			{open && (
				<Menu width={220}>
					<MenuItem label={t("ribbon.stroke.solid")} checked radio />
					<MenuItem label={t("ribbon.stroke.crayon")} checked={false} radio />
					<MenuSeparator />
					<MenuItem label={t("ribbon.show-hide.rulers")} checked />
					<MenuItem label={t("ribbon.show-hide.gridlines")} checked={false} />
				</Menu>
			)}
		</MenuAnchor>
	)
}

/**
 * a menu measures the anchor it sits under, which is only boxed once the anchor
 * is on screen: in the app a click opens it, here the commit after the first.
 */
function useOpenAfterMount() {
	const [open, setOpen] = useState(false)
	useEffect(() => setOpen(true), [])

	return open
}
