import type { Meta, StoryObj } from "@storybook/react-vite"
import { Toast } from "components/Toast"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/Toast",
	component: Toast,
	parameters: { controls: { disable: true } },
} satisfies Meta<typeof Toast>

export default meta

/**
 * the store holds the key, not the text, which is what lets a notice already on
 * screen follow the language toolbar. it also clears itself after a few seconds.
 */
export const Saved: StoryObj<typeof meta> = {
	parameters: {
		state: { ui: { toast: "toast.file.downloaded" } } satisfies StoryState,
	},
}

export const OpenFailed: StoryObj<typeof meta> = {
	parameters: {
		state: { ui: { toast: "toast.file.open-failed" } } satisfies StoryState,
	},
}

/** the longest notice in the table, the one a narrow window has to hold. */
export const Wrapping: StoryObj<typeof meta> = {
	parameters: {
		state: {
			ui: { toast: "toast.clipboard.paste-shortcut" },
		} satisfies StoryState,
	},
}
