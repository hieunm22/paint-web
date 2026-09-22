import type { Meta, StoryObj } from "@storybook/react-vite"
import { TitleBar } from "components/TitleBar"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/TitleBar",
	component: TitleBar,
	parameters: { layout: "padded", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TitleBar>

export default meta

/** a picture with no file behind it yet, which is where the app opens. */
export const Untitled: StoryObj<typeof meta> = {}

export const Saved: StoryObj<typeof meta> = {
	parameters: {
		state: { doc: { fileName: "sunset.png" } } satisfies StoryState,
	},
}

/** unsaved work puts the asterisk in front of the name. */
export const Dirty: StoryObj<typeof meta> = {
	parameters: {
		state: {
			doc: { fileName: "sunset.png", isDirty: true },
		} satisfies StoryState,
	},
}

/** the toolbar with undo and redo live, as it looks after a stroke or two. */
export const WithHistory: StoryObj<typeof meta> = {
	parameters: {
		state: {
			doc: { fileName: "sunset.png", isDirty: true },
			history: { canUndo: true, canRedo: true },
		} satisfies StoryState,
	},
}
