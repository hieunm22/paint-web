import { configureStore } from "@reduxjs/toolkit"
import { useDispatch, useSelector } from "react-redux"
import colors from "./slices/colorsSlice"
import doc from "./slices/docSlice"
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
		ui,
	},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
