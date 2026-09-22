import type { Meta, StoryObj } from "@storybook/react-vite"
import { DropOverlay } from "components/DropOverlay"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/DropOverlay",
	component: DropOverlay,
	parameters: { controls: { disable: true } },
} satisfies Meta<typeof DropOverlay>

export default meta

/**
 * only the drag raises it, and it never takes the pointer: the drop has to
 * reach the window listener under the scrim.
 */
export const Dragging: StoryObj<typeof meta> = {
	parameters: {
		state: { ui: { draggingFile: true } } satisfies StoryState,
	},
}
