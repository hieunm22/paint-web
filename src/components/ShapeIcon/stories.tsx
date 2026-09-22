import type { Meta, StoryObj } from "@storybook/react-vite"
import { useTranslation } from "react-i18next"
import { SHAPE_LABEL_KEYS, SHAPE_ORDER } from "./constant"
import { ShapeIcon } from "components/ShapeIcon"

const meta = {
	title: "Components/ShapeIcon",
	component: ShapeIcon,
	args: { kind: "heart", size: 48 },
	argTypes: {
		kind: { control: "select", options: SHAPE_ORDER },
		size: { control: { type: "range", min: 12, max: 96, step: 4 } },
	},
} satisfies Meta<typeof ShapeIcon>

export default meta

export const Default: StoryObj<typeof meta> = {}

/** the outline takes the color it inherits, which is what grays it out. */
export const Disabled: StoryObj<typeof meta> = {
	render: args => (
		<span style={{ color: "#a0a0a0" }}>
			<ShapeIcon {...args} />
		</span>
	),
}

/** the gallery in ribbon order, hand-drawn because these outlines must be exact. */
export const Gallery: StoryObj<typeof meta> = {
	parameters: { layout: "padded", controls: { disable: true } },
	render: () => <ShapeGallery />,
}

function ShapeGallery() {
	const { t } = useTranslation()

	return (
		<div className="sb__grid">
			{SHAPE_ORDER.map(kind => (
				<div key={kind} className="sb__cell">
					<ShapeIcon kind={kind} size={32} />
					<span>{t(SHAPE_LABEL_KEYS[kind])}</span>
				</div>
			))}
		</div>
	)
}
