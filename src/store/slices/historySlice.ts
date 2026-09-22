import { createSlice } from "@reduxjs/toolkit"
import { historyChanged } from "store/actions"
import type { HistoryState } from "types/store.types"

/**
 * two booleans mirroring the engine's stacks. the tiles themselves never enter
 * redux: an ImageData in state would be compared by reference on every render.
 */
const initialState: HistoryState = {
	canUndo: false,
	canRedo: false,
	revision: 0,
}

const historySlice = createSlice({
	name: "history",
	initialState,
	reducers: {},
	extraReducers: builder => {
		builder.addCase(historyChanged, (state, action) => {
			state.canUndo = action.payload.canUndo
			state.canRedo = action.payload.canRedo
			state.revision += 1
		})
	},
})

export default historySlice.reducer
