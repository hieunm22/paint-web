import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"
import { LiveRegion } from "components/LiveRegion"
import { announce } from "engine/announce"

const meta = {
	title: "Components/LiveRegion",
	component: LiveRegion,
	parameters: { controls: { disable: true } },
} satisfies Meta<typeof LiveRegion>

export default meta

/** off screen by design: what it holds is read out, never seen. */
export const Default: StoryObj<typeof meta> = {}

/** what a screen reader hears after the picture changed under it. */
export const Announcing: StoryObj<typeof meta> = {
	play: async ({ canvas }) => {
		announce("live.selection.size", { 0: 120, 1: 80 })

		await waitFor(() => {
			const region = canvas.getByRole("status")
			expect(region).not.toBeEmptyDOMElement()
		})
	},
}
