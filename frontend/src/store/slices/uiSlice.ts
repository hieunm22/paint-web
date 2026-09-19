import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type {
	DialogId,
	PendingFileAction,
	RibbonTabId,
	UiState,
} from "../types"

const initialState: UiState = {
	tab: "home",
	backstageOpen: false,
	openMenu: null,
	dialog: null,
	pending: null,
	toast: null,
}

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		setTab(state, action: PayloadAction<RibbonTabId>) {
			state.tab = action.payload
			state.backstageOpen = false
			state.openMenu = null
		},
		openBackstage(state) {
			state.backstageOpen = true
			state.openMenu = null
		},
		closeBackstage(state) {
			state.backstageOpen = false
		},
		toggleMenu(state, action: PayloadAction<string>) {
			state.openMenu = state.openMenu === action.payload ? null : action.payload
		},
		closeMenu(state) {
			state.openMenu = null
		},
		openDialog(state, action: PayloadAction<DialogId>) {
			state.dialog = action.payload
			state.openMenu = null
			state.backstageOpen = false
		},
		closeDialog(state) {
			state.dialog = null
			state.pending = null
		},
		/** asks about unsaved work, remembering what it is holding back. */
		confirmDiscard(state, action: PayloadAction<PendingFileAction>) {
			state.dialog = "confirm-discard"
			state.pending = action.payload
			state.openMenu = null
			state.backstageOpen = false
		},
		/** the payload is a translation key: the text follows the language. */
		showToast(state, action: PayloadAction<string>) {
			state.toast = action.payload
		},
		dismissToast(state) {
			state.toast = null
		},
	},
})

export const {
	setTab,
	openBackstage,
	closeBackstage,
	toggleMenu,
	closeMenu,
	openDialog,
	closeDialog,
	confirmDiscard,
	showToast,
	dismissToast,
} = uiSlice.actions
export default uiSlice.reducer
