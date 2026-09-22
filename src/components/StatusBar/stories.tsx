import type { Meta, StoryObj } from "@storybook/react-vite"
import { StatusBar } from "components/StatusBar"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/StatusBar",
	component: StatusBar,
	parameters: { layout: "padded", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof StatusBar>

export default meta

/**
 * the cursor and selection cells read the engine rather than the store: both
 * stay empty until something is drawn in the app itself.
 */
export const Default: StoryObj<typeof meta> = {}

export const Zoomed: StoryObj<typeof meta> = {
	parameters: { state: { view: { zoom: 4 } } satisfies StoryState },
}

/** a document wide enough to push the zoom control across the bar. */
export const LargeDocument: StoryObj<typeof meta> = {
	parameters: {
		state: { doc: { width: 1920, height: 1080 } } satisfies StoryState,
	},
}
