import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { DocumentState, ImageFormat } from "../types"

const initialState: DocumentState = {
	width: 1152,
	height: 648,
	fileName: "Untitled",
	format: "png",
	isDirty: false,
	dpi: 96,
}

const docSlice = createSlice({
	name: "doc",
	initialState,
	reducers: {
		setDocSize(
			state,
			action: PayloadAction<{ width: number; height: number }>,
		) {
			state.width = action.payload.width
			state.height = action.payload.height
			state.isDirty = true
		},
		setFileName(state, action: PayloadAction<string>) {
			state.fileName = action.payload
		},
		setFormat(state, action: PayloadAction<ImageFormat>) {
			state.format = action.payload
		},
		setDirty(state, action: PayloadAction<boolean>) {
			state.isDirty = action.payload
		},
		resetDocument() {
			return initialState
		},
	},
})

export const { setDocSize, setFileName, setFormat, setDirty, resetDocument } =
	docSlice.actions
export default docSlice.reducer
