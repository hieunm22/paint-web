import { createSlice } from "@reduxjs/toolkit"
import type { HistoryState } from "../types"
import { historyChanged } from "../actions"

/**
 * two booleans mirroring the engine's stacks. the tiles themselves never enter
 * redux: an ImageData in state would be compared by reference on every render.
 */
const initialState: HistoryState = {
	canUndo: false,
	canRedo: false,
}

const historySlice = createSlice({
	name: "history",
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder.addCase(historyChanged, (state, action) => {
			state.canUndo = action.payload.canUndo
			state.canRedo = action.payload.canRedo
		})
	},
})

export default historySlice.reducer
