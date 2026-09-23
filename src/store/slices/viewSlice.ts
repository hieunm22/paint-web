import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ZOOM_STEPS } from "common/constant"
import { readSettings } from "common/settings"
import type { Point, ViewState } from "types/store.types"

const settings = readSettings()

const initialState: ViewState = {
	zoom: 1,
	focus: null,
	...settings.view,
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
		/** the magnifier zooms about the pixel that was clicked, as Paint does. */
		zoomAt(state, action: PayloadAction<{ zoom: number; at: Point }>) {
			const { zoom, at } = action.payload
			state.zoom = zoom
			state.focus = { x: at.x, y: at.y, zoom }
		},
		zoomIn(state) {
			state.zoom = ZOOM_STEPS.find(z => z > state.zoom) ?? state.zoom
		},
		zoomOut(state) {
			state.zoom =
				[...ZOOM_STEPS].reverse().find(z => z < state.zoom) ?? state.zoom
		},
		toggleView(state, action: PayloadAction<ToggleKey>) {
			state[action.payload] = !state[action.payload]
		},
	},
})

export const {
	setZoom,
	zoomAt,
	zoomIn,
	zoomOut,
	toggleView,
} =
	viewSlice.actions
export default viewSlice.reducer
