import type { Meta, StoryObj } from "@storybook/react-vite"
import { CanvasViewport } from "components/CanvasViewport"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/CanvasViewport",
	component: CanvasViewport,
	parameters: { layout: "padded", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame sb__frame--tall">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof CanvasViewport>

export default meta

/**
 * the one engine instance paints into these canvases: this story draws for real,
 * while a story naming its own state has a store the engine never answers.
 */
export const Default: StoryObj<typeof meta> = {}

/** rulers need zoom >= 1, which is where they earn their tick spacing. */
export const Rulers: StoryObj<typeof meta> = {
	parameters: {
		state: { view: { showRuler: true, zoom: 1 } } satisfies StoryState,
	},
}

/** gridlines only appear from zoom 4, one line per image pixel. */
export const Gridlines: StoryObj<typeof meta> = {
	parameters: {
		state: {
			view: { showGrid: true, showRuler: true, zoom: 4 },
		} satisfies StoryState,
	},
}

export const Thumbnail: StoryObj<typeof meta> = {
	parameters: {
		state: { view: { showThumbnail: true, zoom: 6 } } satisfies StoryState,
	},
}

/** a paper large enough to scroll, with the handles on its right and bottom edges. */
export const LargeDocument: StoryObj<typeof meta> = {
	parameters: {
		state: { doc: { width: 1600, height: 1200 } } satisfies StoryState,
	},
}
