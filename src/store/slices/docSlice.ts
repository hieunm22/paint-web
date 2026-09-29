import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { readSettings } from "common/settings"
import type { Size } from "types/engine.types"
import type {
	DocumentState,
	ImageFormat,
	OpenedPayload,
} from "types/store.types"

const startSize = readSettings().pageSize

const initialState: DocumentState = {
	width: startSize.width,
	height: startSize.height,
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
		/** a file replaced the document: name, size and format all come with it. */
		documentOpened(state, action: PayloadAction<OpenedPayload>) {
			const {
				width,
				height,
				fileName,
				format,
				savedAt,
			} = action.payload
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
		/** New keeps no part of the old document but the paper it opens at. */
		resetDocument(_state, action: PayloadAction<Size>) {
			return {
				...initialState,
				width: action.payload.width,
				height: action.payload.height,
			}
		},
		setDirty(state, action: PayloadAction<boolean>) {
			state.isDirty = action.payload
		},
		setDocSize(
			state,
			action: PayloadAction<{ width: number; height: number }>,
		) {
			state.width = action.payload.width
			state.height = action.payload.height
			state.isDirty = true
		},
	},
})

export const {
	documentOpened,
	documentSaved,
	resetDocument,
	setDirty,
	setDocSize,
} = docSlice.actions
export default docSlice.reducer
