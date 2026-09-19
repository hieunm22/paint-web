import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { DEFAULT_DOCUMENT } from "../constant"
import type { DocumentState, ImageFormat, OpenedPayload } from "../types"

const initialState: DocumentState = {
	width: DEFAULT_DOCUMENT.width,
	height: DEFAULT_DOCUMENT.height,
	fileName: "",
	format: "png",
	isDirty: false,
	savedAt: null,
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
		setDirty(state, action: PayloadAction<boolean>) {
			state.isDirty = action.payload
		},
		/** a file replaced the document: name, size and format all come with it. */
		documentOpened(state, action: PayloadAction<OpenedPayload>) {
			const { width, height, fileName, format, savedAt } = action.payload
			state.width = width
			state.height = height
			state.fileName = fileName
			state.format = format
			state.savedAt = savedAt
			state.isDirty = false
		},
		/** the bytes reached disk, or at least the browser's download folder. */
		documentSaved(
			state,
			action: PayloadAction<{ fileName: string; format: ImageFormat }>,
		) {
			state.fileName = action.payload.fileName
			state.format = action.payload.format
			state.savedAt = Date.now()
			state.isDirty = false
		},
		resetDocument() {
			return initialState
		},
	},
})

export const {
	setDocSize,
	setDirty,
	documentOpened,
	documentSaved,
	resetDocument,
} = docSlice.actions
export default docSlice.reducer
