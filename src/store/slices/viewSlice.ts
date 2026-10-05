import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { ZOOM_STEPS } from "common/constant"
import { readSettings } from "common/settings"
import type {
	Point,
	ViewState,
	ZoomAroundPayload,
	ZoomDirection,
} from "types/store.types"

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

/** the next stop on the ladder, or the same one at either end. */
function steppedZoom(zoom: number, direction: ZoomDirection): number {
	if (direction === "in") return ZOOM_STEPS.find(z => z > zoom) ?? zoom

	return [...ZOOM_STEPS].reverse().find(z => z < zoom) ?? zoom
}

const viewSlice = createSlice({
	name: "view",
	initialState,
	reducers: {
		setZoom(state, action: PayloadAction<number>) {
			state.zoom = action.payload
		},
		toggleView(state, action: PayloadAction<ToggleKey>) {
			state[action.payload] = !state[action.payload]
		},
		/** Ctrl+wheel keeps the pixel under the pointer where it is. */
		zoomAround(state, action: PayloadAction<ZoomAroundPayload>) {
			const { direction, at, anchor } = action.payload
			const zoom = steppedZoom(state.zoom, direction)
			if (zoom === state.zoom) return

			state.zoom = zoom
			state.focus = { x: at.x, y: at.y, zoom, anchor }
		},
		/** the magnifier zooms about the pixel that was clicked, as Paint does. */
		zoomAt(state, action: PayloadAction<{ zoom: number; at: Point }>) {
			const { zoom, at } = action.payload
			state.zoom = zoom
			state.focus = { x: at.x, y: at.y, zoom, anchor: null }
		},
		zoomIn(state) {
			state.zoom = steppedZoom(state.zoom, "in")
		},
		zoomOut(state) {
			state.zoom = steppedZoom(state.zoom, "out")
		},
	},
})

export const {
	setZoom,
	toggleView,
	zoomAround,
	zoomAt,
	zoomIn,
	zoomOut,
} =
	viewSlice.actions
export default viewSlice.reducer
