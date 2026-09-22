import type { Meta, StoryObj } from "@storybook/react-vite"
import type { PropsWithChildren } from "react"
import { Ribbon } from "components/Ribbon"
import { useDismissMenus } from "hooks/useDismissMenus"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/Ribbon",
	component: Ribbon,
	parameters: { layout: "padded", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame">
				<Harness>
					<Story />
				</Harness>
			</div>
		),
	],
} satisfies Meta<typeof Ribbon>

export default meta

/** every control with nothing behind it yet is disabled, and looks it. */
export const HomeTab: StoryObj<typeof meta> = {
	parameters: { state: { ui: { tab: "home" } } satisfies StoryState },
}

export const ViewTab: StoryObj<typeof meta> = {
	parameters: { state: { ui: { tab: "view" } } satisfies StoryState },
}

/** the contextual tab: on the strip only while a text box is open. */
export const TextTab: StoryObj<typeof meta> = {
	parameters: {
		state: { ui: { tab: "text", textTab: true } } satisfies StoryState,
	},
}

/** the pencil in hand, which moves the pressed state off the selection tool. */
export const PencilSelected: StoryObj<typeof meta> = {
	parameters: { state: { tool: { active: "pencil" } } satisfies StoryState },
}

/** the dismissal the app shell wires around the strip. */
function Harness({ children }: PropsWithChildren) {
	useDismissMenus()

	return <>{children}</>
}
