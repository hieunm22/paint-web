import type {
	BrushDef,
	FontStyleDef,
	RibbonTabDef,
	SizeDef,
	StrokeStyleDef,
	ToolDef,
} from "./types"

/** which way each arrow walks the toolbar; every other key is left alone. */
export const ARROW_STEPS: Record<string, number | undefined> = {
	ArrowRight: 1,
	ArrowLeft: -1,
}

export const RIBBON_TABS: RibbonTabDef[] = [
	{ id: "home", labelKey: "ribbon.tab.home" },
	{ id: "view", labelKey: "ribbon.tab.view" },
]

/** 3x2 grid in the same order Paint uses. */
export const TOOLS: ToolDef[] = [
	{ id: "pencil", icon: "pencil", labelKey: "ribbon.tools.pencil" },
	{ id: "fill", icon: "fill", labelKey: "ribbon.tools.fill" },
	{ id: "text", icon: "text", labelKey: "ribbon.tools.text" },
	{ id: "eraser", icon: "eraser", labelKey: "ribbon.tools.eraser" },
	{ id: "picker", icon: "picker", labelKey: "ribbon.tools.picker" },
	{
		id: "magnifier",
		icon: "magnifier",
		labelKey: "ribbon.tools.magnifier",
	},
]

/** the nine brushes. */
export const BRUSHES: BrushDef[] = [
	{ id: "brush", icon: "brush", labelKey: "ribbon.brushes.brush" },
	{
		id: "calligraphy1",
		icon: "calligraphy1",
		labelKey: "ribbon.brushes.calligraphy1",
		rotate: -45,
	},
	{
		id: "calligraphy2",
		icon: "calligraphy2",
		labelKey: "ribbon.brushes.calligraphy2",
		rotate: 45,
	},
	{
		id: "airbrush",
		icon: "airbrush",
		labelKey: "ribbon.brushes.airbrush",
	},
	{ id: "oil", icon: "oil", labelKey: "ribbon.brushes.oil" },
	{ id: "crayon", icon: "crayon", labelKey: "ribbon.brushes.crayon" },
	{ id: "marker", icon: "marker", labelKey: "ribbon.brushes.marker" },
	{
		id: "natural-pencil",
		icon: "natural-pencil",
		labelKey: "ribbon.brushes.natural-pencil",
	},
	{
		id: "watercolor",
		icon: "watercolor",
		labelKey: "ribbon.brushes.watercolor",
	},
]

/** shared by the Outline and Fill menus. */
export const STROKE_STYLES: StrokeStyleDef[] = [
	{ id: "none", labelKey: "ribbon.stroke.none" },
	{ id: "solid", labelKey: "ribbon.stroke.solid" },
	{ id: "crayon", labelKey: "ribbon.stroke.crayon" },
	{ id: "marker", labelKey: "ribbon.stroke.marker" },
	{ id: "oil", labelKey: "ribbon.stroke.oil" },
	{ id: "natural-pencil", labelKey: "ribbon.stroke.natural-pencil" },
	{ id: "watercolor", labelKey: "ribbon.stroke.watercolor" },
]

/** the Fill menu shows "no fill" where Outline shows "no outline". */
export const NO_FILL_KEY = "ribbon.stroke.none-fill"

/** Paint offers only these four sizes. */
export const SIZES: SizeDef[] = [1, 3, 5, 8]

/** shape gallery: 3 rows of 7 on show, scrolling one row at a time. */
export const SHAPE_GALLERY_COLS = 7
export const SHAPE_GALLERY_VISIBLE_ROWS = 3
export const SHAPE_GALLERY_ROW_HEIGHT = 23

/** the strip and the panel behind the expand button share their columns. */
export const SHAPE_GRID_COLUMNS = `repeat(${SHAPE_GALLERY_COLS}, 26px)`
export const SHAPE_PANEL_WIDTH = SHAPE_GALLERY_COLS * 27 + 10

/**
 * the fallback list, for a browser that will not name the installed fonts.
 * every name here ships with some platform and falls back cleanly elsewhere.
 */
export const FONT_FAMILIES = [
	"Arial",
	"Calibri",
	"Cambria",
	"Comic Sans MS",
	"Courier New",
	"Georgia",
	"Helvetica",
	"Impact",
	"Tahoma",
	"Times New Roman",
	"Trebuchet MS",
	"Verdana",
]

/** the point sizes Paint's size box offers. */
export const FONT_SIZES = [
	8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72,
]

/** the four character styles, each a toggle of its own. */
export const FONT_STYLES: FontStyleDef[] = [
	{ id: "bold", icon: "bold", labelKey: "ribbon.font.bold" },
	{ id: "italic", icon: "italic", labelKey: "ribbon.font.italic" },
	{ id: "underline", icon: "underline", labelKey: "ribbon.font.underline" },
	{
		id: "strikethrough",
		icon: "strikethrough",
		labelKey: "ribbon.font.strikethrough",
	},
]
