import type { Meta, StoryObj } from "@storybook/react-vite"
import { FullScreenView } from "components/FullScreenView"

const meta = {
	title: "Components/FullScreenView",
	component: FullScreenView,
	parameters: { layout: "fullscreen", controls: { disable: true } },
} satisfies Meta<typeof FullScreenView>

export default meta

/**
 * the picture alone on black, and a click anywhere puts the window back. the
 * browser's own full screen needs a gesture, which a story never makes.
 */
export const Default: StoryObj<typeof meta> = {}
