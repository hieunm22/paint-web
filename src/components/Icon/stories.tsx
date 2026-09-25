import type { Meta, StoryObj } from "@storybook/react-vite"
import { ICONS, SVG_ICONS } from "./constant"
import { Icon } from "components/Icon"
import type { IconName } from "./types"

/** the registry read as a list, which is what the gallery walks. */
const ICON_NAMES = [
	...Object.keys(ICONS),
	...Object.keys(SVG_ICONS),
] as IconName[]

const meta = {
	title: "Components/Icon",
	component: Icon,
	args: { name: "brush", size: 32 },
	argTypes: {
		name: { control: "select", options: ICON_NAMES },
		size: { control: { type: "range", min: 8, max: 64, step: 1 } },
		rotate: { control: { type: "range", min: 0, max: 360, step: 15 } },
	},
} satisfies Meta<typeof Icon>

export default meta

export const Default: StoryObj<typeof meta> = {}

/** size drives font-size alone: a wide glyph stays as wide as it is drawn. */
export const Sizes: StoryObj<typeof meta> = {
	parameters: { controls: { disable: true } },
	render: () => (
		<div className="sb__row">
			<Icon name="brush" size={16} />
			<Icon name="brush" size={24} />
			<Icon name="brush" size={32} />
			<Icon name="brush" size={48} />
		</div>
	),
}

/** the rotation the calligraphy brushes lean their glyph by. */
export const Rotated: StoryObj<typeof meta> = {
	args: { name: "calligraphy1", rotate: 45 },
}

export const Colored: StoryObj<typeof meta> = {
	args: { name: "fill", color: "#0078d7" },
}

/** the whole registry: an icon reaches the interface from here or not at all. */
export const Registry: StoryObj<typeof meta> = {
	parameters: { layout: "padded", controls: { disable: true } },
	render: () => (
		<div className="sb__grid">
			{ICON_NAMES.map(name => (
				<div key={name} className="sb__cell">
					<Icon name={name} size={22} />
					<code>{name}</code>
				</div>
			))}
		</div>
	),
}
