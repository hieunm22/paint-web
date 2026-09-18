import type {
	BrushDef,
	RibbonTabDef,
	SizeDef,
	StrokeStyleDef,
	ToolDef,
} from "./types"

export const RIBBON_TABS: RibbonTabDef[] = [
	{ id: "home", label: "Home" },
	{ id: "view", label: "View" },
]

/** 3x2 grid in the same order Paint uses. */
export const TOOLS: ToolDef[] = [
	{ id: "pencil", icon: "pencil", label: "Pencil" },
	{ id: "fill", icon: "fill", label: "Fill with colour" },
	{ id: "text", icon: "text", label: "Text" },
	{ id: "eraser", icon: "eraser", label: "Eraser" },
	{ id: "picker", icon: "picker", label: "Colour picker" },
	{ id: "magnifier", icon: "magnifier", label: "Magnifier" },
]

/** the nine brushes. */
export const BRUSHES: BrushDef[] = [
	{ id: "brush", icon: "brush", label: "Brush" },
	{
		id: "calligraphy1",
		icon: "calligraphy1",
		label: "Calligraphy brush 1",
		rotate: -45,
	},
	{
		id: "calligraphy2",
		icon: "calligraphy2",
		label: "Calligraphy brush 2",
		rotate: 45,
	},
	{ id: "airbrush", icon: "airbrush", label: "Airbrush" },
	{ id: "oil", icon: "oil", label: "Oil brush" },
	{ id: "crayon", icon: "crayon", label: "Crayon" },
	{ id: "marker", icon: "marker", label: "Marker" },
	{ id: "natural-pencil", icon: "natural-pencil", label: "Natural pencil" },
	{ id: "watercolor", icon: "watercolor", label: "Watercolour" },
]

/** shared by the Outline and Fill menus. */
export const STROKE_STYLES: StrokeStyleDef[] = [
	{ id: "none", label: "No outline" },
	{ id: "solid", label: "Solid colour" },
	{ id: "crayon", label: "Crayon" },
	{ id: "marker", label: "Marker" },
	{ id: "oil", label: "Oil" },
	{ id: "natural-pencil", label: "Natural pencil" },
	{ id: "watercolor", label: "Watercolour" },
]

/** Paint offers only these four sizes. */
export const SIZES: SizeDef[] = [1, 3, 5, 8]

/** shape gallery: 3 rows of 8, scrolling one row at a time. */
export const SHAPE_GALLERY_COLS = 8
export const SHAPE_GALLERY_VISIBLE_ROWS = 3
export const SHAPE_GALLERY_ROW_HEIGHT = 23
