import type { Meta, StoryObj } from "@storybook/react-vite"
import { useTranslation } from "react-i18next"
import { expect, screen } from "storybook/test"
import Menu from "components/Menu"
import { MenuItem, MenuSeparator } from "components/Menu/components"
import {
	IconButton,
	LargeButton,
	SmallButton,
	SplitButton,
} from "components/RibbonButton"
import { shortcutText } from "locales/common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { toggleMenu } from "store/slices/uiSlice"
import type { RibbonButtonProps } from "./types"

/** the menu id this story parks in `ui.openMenu`, as a ribbon group does. */
const STORY_MENU = "story-split"

const meta = {
	title: "Components/RibbonButton",
	component: LargeButton,
	// each story translates its own label; the args carry the state to play with
	args: {
		label: "",
		disabled: false,
		selected: false,
		caret: false,
	},
	argTypes: {
		label: { control: false },
		icon: { control: false },
		iconNode: { control: false },
	},
} satisfies Meta<typeof LargeButton>

export default meta

/** 32px icon over the label, the shape the first button of a group takes. */
export const Large: StoryObj<typeof meta> = {
	render: props => <PasteButton {...props} />,
}

export const LargeSelected: StoryObj<typeof meta> = {
	...Large,
	args: { selected: true },
}

/** a control with nothing behind it yet carries `disabled`, never a dead click. */
export const LargeDisabled: StoryObj<typeof meta> = {
	...Large,
	args: { disabled: true },
}

/** 16px icon on a single line, stacked three to a group. */
export const Small: StoryObj<typeof meta> = {
	render: props => <CutButton {...props} />,
}

/** the tools grid: the label is the accessible name, not a visible one. */
export const IconOnly: StoryObj<typeof meta> = {
	render: props => <PencilButton {...props} />,
}

/** top half acts, bottom half opens the menu; each half hovers on its own. */
export const Split: StoryObj<typeof meta> = {
	render: props => <SelectButton {...props} />,
	play: async ({ canvas, userEvent }) => {
		const buttons = canvas.getAllByRole("button")
		const opener = buttons[buttons.length - 1]
		await userEvent.click(opener)

		const menu = screen.getByRole("menu")

		await expect(menu).toBeInTheDocument()
	},
}

function PasteButton(props: RibbonButtonProps) {
	const { t } = useTranslation()

	return (
		<LargeButton {...props} icon="paste" label={t("ribbon.clipboard.paste")} />
	)
}

function CutButton(props: RibbonButtonProps) {
	const { t } = useTranslation()

	return <SmallButton {...props} icon="cut" label={t("ribbon.clipboard.cut")} />
}

function PencilButton(props: RibbonButtonProps) {
	const { t } = useTranslation()

	return (
		<IconButton {...props} icon="pencil" label={t("ribbon.tools.pencil")} />
	)
}

function SelectButton(props: RibbonButtonProps) {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const open = useAppSelector(s => s.ui.openMenu === STORY_MENU)

	return (
		<SplitButton
			{...props}
			icon="select"
			label={t("ribbon.image.select")}
			open={open}
			onToggleMenu={() => dispatch(toggleMenu(STORY_MENU))}
			menu={
				<Menu width={200}>
					<MenuItem label={t("ribbon.image.select-rect")} icon="select" />
					<MenuItem label={t("ribbon.image.select-free")} icon="select" />
					<MenuSeparator />
					<MenuItem
						label={t("ribbon.image.select-all")}
						shortcut={shortcutText("shortcut.image.select-all")}
					/>
				</Menu>
			}
		/>
	)
}
