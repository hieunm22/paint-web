import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { ViewState } from "../types"

export const ZOOM_STEPS = [0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8]

const initialState: ViewState = {
	zoom: 1,
	showRuler: false,
	showGrid: false,
	showStatusBar: true,
	showThumbnail: false,
	fullScreen: false,
}

type ToggleKey =
	"showRuler" | "showGrid" | "showStatusBar" | "showThumbnail" | "fullScreen"

const viewSlice = createSlice({
	name: "view",
	initialState,
	reducers: {
		setZoom(state, action: PayloadAction<number>) {
			state.zoom = action.payload
		},
		zoomIn(state) {
			state.zoom = ZOOM_STEPS.find((z) => z > state.zoom) ?? state.zoom
		},
		zoomOut(state) {
			state.zoom =
				[...ZOOM_STEPS].reverse().find((z) => z < state.zoom) ?? state.zoom
		},
		toggleView(state, action: PayloadAction<ToggleKey>) {
			state[action.payload] = !state[action.payload]
		},
	},
})

export const { setZoom, zoomIn, zoomOut, toggleView } = viewSlice.actions
export default viewSlice.reducer
