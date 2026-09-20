import { useTranslation } from "react-i18next"
import { FONT_SIZES, FONT_STYLES } from "../constant"
import { IconButton, SmallButton } from "components/RibbonButton"
import { ButtonStack, RibbonGroup } from "components/RibbonGroup"
import { useFontFamilies, useTextRibbon } from "../hooks"
import { ClipboardGroup } from "./ClipboardGroup"
import { ColorsGroup } from "./ColorsGroup"

/** Text tab: it exists only while a text box is open on the canvas. */
export function TextTabGroups() {
	return (
		<>
			<ClipboardGroup />
			<FontGroup />
			<BackgroundGroup />
			<ColorsGroup />
		</>
	)
}

/** family and size boxes over the four character styles, as Paint stacks them. */
function FontGroup() {
	const { t } = useTranslation()
	const {
		options,
		setFamily,
		setSize,
		toggleStyle,
	} = useTextRibbon()
	const { families, load } = useFontFamilies(options.fontFamily)

	return (
		<RibbonGroup label={t("ribbon.font.label")}>
			<div className="font-grid">
				<select
					className="font-grid__box font-grid__box--family"
					aria-label={t("ribbon.font.family")}
					value={options.fontFamily}
					onPointerDown={load}
					onChange={e => setFamily(e.target.value)}
				>
					{families.map(family => (
						<option key={family} value={family} style={{ fontFamily: family }}>
							{family}
						</option>
					))}
				</select>

				<select
					className="font-grid__box font-grid__box--size"
					aria-label={t("ribbon.font.size")}
					value={options.fontSize}
					onChange={e => setSize(Number(e.target.value))}
				>
					{FONT_SIZES.map(size => (
						<option key={size} value={size}>
							{size}
						</option>
					))}
				</select>

				<div className="font-grid__styles">
					{FONT_STYLES.map(style => (
						<IconButton
							key={style.id}
							label={t(style.labelKey)}
							icon={style.icon}
							selected={options[style.id]}
							onClick={() => toggleStyle(style.id)}
						/>
					))}
				</div>
			</div>
		</RibbonGroup>
	)
}

/** whether the box carries colour 2 behind the glyphs or lets the picture through. */
function BackgroundGroup() {
	const { t } = useTranslation()
	const { options, setBackground } = useTextRibbon()

	return (
		<RibbonGroup label={t("ribbon.background.label")}>
			<ButtonStack>
				<SmallButton
					label={t("ribbon.background.transparent")}
					icon="backgroundTransparent"
					selected={options.background === "transparent"}
					onClick={() => setBackground("transparent")}
				/>
				<SmallButton
					label={t("ribbon.background.opaque")}
					icon="backgroundOpaque"
					selected={options.background === "opaque"}
					onClick={() => setBackground("opaque")}
				/>
			</ButtonStack>
		</RibbonGroup>
	)
}
