import { configureStore } from "@reduxjs/toolkit"
import colors from "./slices/colorsSlice"
import doc from "./slices/docSlice"
import history from "./slices/historySlice"
import selection from "./slices/selectionSlice"
import tool from "./slices/toolSlice"
import ui from "./slices/uiSlice"
import view from "./slices/viewSlice"

export const store = configureStore({
	reducer: {
		doc,
		tool,
		colors,
		view,
		selection,
		history,
		ui,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
