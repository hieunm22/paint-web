import type { Meta, StoryObj } from "@storybook/react-vite"
import { DialogHost } from "components/DialogHost"
import type { DialogId } from "types/store.types"
import type { StoryState } from "types/storybook.types"

const meta = {
	title: "Components/DialogHost",
	component: DialogHost,
	parameters: { layout: "fullscreen", controls: { disable: true } },
	decorators: [
		Story => (
			<div className="sb__frame sb__frame--tall">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof DialogHost>

export default meta

/** one story per dialog the host can put up; the store decides which. */
function dialog(id: DialogId): StoryObj<typeof meta> {
	return { parameters: { state: { ui: { dialog: id } } satisfies StoryState } }
}

export const ResizeSkew: StoryObj<typeof meta> = dialog("resize-skew")

export const EditColors: StoryObj<typeof meta> = dialog("edit-colors")

export const ImageProperties: StoryObj<typeof meta> = dialog("image-properties")

export const SaveAs: StoryObj<typeof meta> = dialog("save-as")

export const ConfirmDiscard: StoryObj<typeof meta> = dialog("confirm-discard")

export const About: StoryObj<typeof meta> = dialog("about")

export const PageSetup: StoryObj<typeof meta> = dialog("page-setup")

/** the sheet is drawn from the picture the engine holds, blank in a story. */
export const PrintPreview: StoryObj<typeof meta> = dialog("print-preview")

/** the camera is refused without a permission, which is the state shown here. */
export const FromCamera: StoryObj<typeof meta> = dialog("from-camera")

/** nothing open: the host renders nothing at all. */
export const Closed: StoryObj<typeof meta> = {}
