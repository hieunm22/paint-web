import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Rect, SelectionState } from "types/store.types"

const initialState: SelectionState = {
	kind: "none",
	bounds: null,
	transparent: false,
}

const selectionSlice = createSlice({
	name: "selection",
	initialState,
	reducers: {
		clearSelection(state) {
			state.kind = "none"
			state.bounds = null
		},
		setSelection(
			state,
			action: PayloadAction<{ kind: "rect" | "free"; bounds: Rect }>,
		) {
			state.kind = action.payload.kind
			state.bounds = action.payload.bounds
		},
		toggleTransparent(state) {
			state.transparent = !state.transparent
		},
	},
})

export const { clearSelection, setSelection, toggleTransparent } =
	selectionSlice.actions
export default selectionSlice.reducer
