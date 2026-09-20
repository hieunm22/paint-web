import { configureStore } from "@reduxjs/toolkit"
import colors from "store/slices/colorsSlice"
import doc from "store/slices/docSlice"
import history from "store/slices/historySlice"
import print from "store/slices/printSlice"
import selection from "store/slices/selectionSlice"
import tool from "store/slices/toolSlice"
import ui from "store/slices/uiSlice"
import view from "store/slices/viewSlice"

export const store = configureStore({
	reducer: {
		doc,
		tool,
		colors,
		view,
		selection,
		history,
		ui,
		print,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
