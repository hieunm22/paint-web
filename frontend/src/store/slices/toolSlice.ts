import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type {
	BrushKind,
	BrushSize,
	ShapeKind,
	StrokeStyle,
	TextOptions,
	ToolId,
	ToolState,
} from "../types"

const initialState: ToolState = {
	active: "pencil",
	brush: "brush",
	shape: "line",
	size: 1,
	outline: "solid",
	fill: "none",
	text: {
		fontFamily: "Calibri",
		fontSize: 11,
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
		background: "transparent",
	},
}

const SIZES: BrushSize[] = [1, 3, 5, 8]

const toolSlice = createSlice({
	name: "tool",
	initialState,
	reducers: {
		setTool(state, action: PayloadAction<ToolId>) {
			state.active = action.payload
		},
		setBrush(state, action: PayloadAction<BrushKind>) {
			state.brush = action.payload
			state.active = "brush"
		},
		setShape(state, action: PayloadAction<ShapeKind>) {
			state.shape = action.payload
			state.active = "shape"
		},
		setSize(state, action: PayloadAction<BrushSize>) {
			state.size = action.payload
		},
		/** Ctrl+= and Ctrl+- step through the four sizes. */
		stepSize(state, action: PayloadAction<1 | -1>) {
			const i = SIZES.indexOf(state.size) + action.payload
			if (i >= 0 && i < SIZES.length) state.size = SIZES[i]
		},
		setOutline(state, action: PayloadAction<StrokeStyle>) {
			state.outline = action.payload
		},
		setFill(state, action: PayloadAction<StrokeStyle>) {
			state.fill = action.payload
		},
		setTextOptions(state, action: PayloadAction<Partial<TextOptions>>) {
			Object.assign(state.text, action.payload)
		},
	},
})

export const {
	setTool,
	setBrush,
	setShape,
	setSize,
	stepSize,
	setOutline,
	setFill,
	setTextOptions,
} = toolSlice.actions
export default toolSlice.reducer
