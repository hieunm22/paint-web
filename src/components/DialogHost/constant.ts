import type { ImageFormat } from "types/store.types"
import type {
	ColorModeOption,
	MarginField,
	OrientationOption,
	PaperOption,
	SizeUnit,
	UnitOption,
} from "./types"

/** the quality slider runs on whole percent and only jpeg and webp read it. */
export const DEFAULT_QUALITY = 92

export const FORMAT_HINT_KEYS: Record<ImageFormat, string> = {
	png: "dialog.save-as.hint-png",
	jpeg: "dialog.save-as.hint-jpeg",
	bmp: "dialog.save-as.hint-bmp",
	gif: "dialog.save-as.hint-gif",
	webp: "dialog.save-as.hint-webp",
	ico: "dialog.save-as.hint-ico",
}

/** what a dialog may hand the keyboard to, which is what Tab cycles through. */
export const FOCUSABLE =
	"button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])"

/** the papers Page setup offers, in the order it lists them. */
export const PAPER_OPTIONS: PaperOption[] = [
	{ id: "a4", labelKey: "dialog.page-setup.a4" },
	{ id: "letter", labelKey: "dialog.page-setup.letter" },
]

export const ORIENTATION_OPTIONS: OrientationOption[] = [
	{ id: "portrait", labelKey: "dialog.page-setup.portrait" },
	{ id: "landscape", labelKey: "dialog.page-setup.landscape" },
]

/** the four margin fields, left and right first as the dialog reads. */
export const MARGIN_FIELDS: MarginField[] = [
	{ edge: "left", labelKey: "dialog.page-setup.left" },
	{ edge: "right", labelKey: "dialog.page-setup.right" },
	{ edge: "top", labelKey: "dialog.page-setup.top" },
	{ edge: "bottom", labelKey: "dialog.page-setup.bottom" },
]

/** the units Image Properties offers, in the order Paint lists them. */
export const UNIT_OPTIONS: UnitOption[] = [
	{ id: "inches", labelKey: "dialog.image-properties.inches" },
	{ id: "centimeters", labelKey: "dialog.image-properties.centimeters" },
	{ id: "pixels", labelKey: "dialog.image-properties.pixels" },
]

export const COLOR_MODE_OPTIONS: ColorModeOption[] = [
	{
		id: "black-and-white",
		labelKey: "dialog.image-properties.black-and-white",
	},
	{ id: "color", labelKey: "dialog.image-properties.color" },
]

/** how fine a size field steps: whole pixels, hundredths of the others. */
export const UNIT_STEP: Record<SizeUnit, number> = {
	inches: 0.01,
	centimeters: 0.01,
	pixels: 1,
}

/** how wide the preview draws one sheet, in css pixels. */
export const SHEET_WIDTH = 288

/** hue wraps at 240 rather than reaching it, the way Windows counts it. */
export const HUE_MAX = 240

/** top of the saturation and luminance scales, and of the fields drawn for them. */
export const LEVEL_MAX = 240

/** side of the hue and saturation field, in css pixels. */
export const COLOR_FIELD_SIZE = 176

/** the 48 fixed Basic colors from the classic Windows dialog. */
export const BASIC_COLORS = [
	"#ff8080",
	"#ffff80",
	"#80ff80",
	"#00ff80",
	"#80ffff",
	"#0080ff",
	"#ff80c0",
	"#ff0000",
	"#ffff00",
	"#80ff00",
	"#00ff40",
	"#00ffff",
	"#0080c0",
	"#8080c0",
	"#804040",
	"#ff8040",
	"#00ff00",
	"#008080",
	"#004080",
	"#8080ff",
	"#800040",
	"#ff0080",
	"#ff8000",
	"#008000",
	"#008040",
	"#0000ff",
	"#0000a0",
	"#800080",
	"#8000ff",
	"#804000",
	"#004000",
	"#004040",
	"#000080",
	"#000040",
	"#400040",
	"#400080",
	"#805000",
	"#402000",
	"#002000",
	"#002040",
	"#000000",
	"#202020",
	"#ffffff",
	"#c0c0c0",
	"#808080",
	"#404040",
	"#ff00ff",
	"#80ff80",
	"#00a0a0",
]
