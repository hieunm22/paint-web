import type { Meta, StoryObj } from "@storybook/react-vite"
import { useTranslation } from "react-i18next"
import { LargeButton, SmallButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"

const meta = {
	title: "Components/RibbonGroup",
	component: RibbonGroup,
	// the group is built inside the story; the args are only what the type asks
	args: { label: "", children: null },
	parameters: { controls: { disable: true } },
} satisfies Meta<typeof RibbonGroup>

export default meta

/** the Clipboard group as the Home tab builds it: one large button, then a stack. */
export const Default: StoryObj<typeof meta> = {
	render: () => <ClipboardGroup />,
}

function ClipboardGroup() {
	const { t } = useTranslation()

	return (
		<div className="ribbon__content">
			<RibbonGroup label={t("ribbon.clipboard.label")}>
				<LargeButton label={t("ribbon.clipboard.paste")} icon="paste" caret />
				<ButtonStack>
					<SmallButton label={t("ribbon.clipboard.cut")} icon="cut" />
					<SmallButton label={t("ribbon.clipboard.copy")} icon="copy" />
				</ButtonStack>
			</RibbonGroup>
		</div>
	)
}
