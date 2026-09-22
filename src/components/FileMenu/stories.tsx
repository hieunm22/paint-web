import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileMenu } from "components/FileMenu"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/FileMenu",
	component: FileMenu,
	parameters: { layout: "padded", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame sb__frame--tall">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FileMenu>

export default meta

/**
 * the blue backstage of the File tab. the recents column lists what this
 * browser opened before: empty until the app itself has been used.
 */
export const Default: StoryObj<typeof meta> = {
	parameters: { state: { ui: { backstageOpen: true } } satisfies StoryState },
}

/** a saved picture, which is what arms Save and the properties row. */
export const WithDocument: StoryObj<typeof meta> = {
	parameters: {
		state: {
			ui: { backstageOpen: true },
			doc: { fileName: "sunset.png", savedAt: Date.now() },
		} satisfies StoryState,
	},
}
