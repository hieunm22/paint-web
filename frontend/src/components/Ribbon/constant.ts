import type {
	BrushDef,
	RibbonTabDef,
	SizeDef,
	StrokeStyleDef,
	ToolDef,
} from "./types"

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

/** shape gallery: 3 rows of 8, scrolling one row at a time. */
export const SHAPE_GALLERY_COLS = 8
export const SHAPE_GALLERY_VISIBLE_ROWS = 3
export const SHAPE_GALLERY_ROW_HEIGHT = 23
