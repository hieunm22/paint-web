import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { QAT_ORDER } from "common/constant"
import { readQat } from "store/common"
import type {
	DialogId,
	PendingFileAction,
	QatItemId,
	RibbonTabId,
	UiState,
} from "types/store.types"

const initialState: UiState = {
	tab: "home",
	textTab: false,
	priorTab: "home",
	backstageOpen: false,
	openMenu: null,
	dialog: null,
	pending: null,
	toast: null,
	qat: readQat(),
}

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		setTab(state, action: PayloadAction<RibbonTabId>) {
			state.tab = action.payload
			if (action.payload !== "text") state.priorTab = action.payload
			state.backstageOpen = false
			state.openMenu = null
		},
		/** a text box opened on the canvas: the Text tab appears and takes over. */
		showTextTab(state) {
			state.textTab = true
			state.tab = "text"
			state.backstageOpen = false
			state.openMenu = null
		},
		/** the box was baked or dropped, and the tab the user came from is back. */
		hideTextTab(state) {
			state.textTab = false
			if (state.tab === "text") state.tab = state.priorTab
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
		/** the fixed order decides where a re-added button lands, not the click. */
		toggleQat(state, action: PayloadAction<QatItemId>) {
			const id = action.payload
			const shown = state.qat.includes(id)
			state.qat = QAT_ORDER.filter(one =>
				one === id ? !shown : state.qat.includes(one),
			)
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
	showTextTab,
	hideTextTab,
	openBackstage,
	closeBackstage,
	toggleMenu,
	closeMenu,
	toggleQat,
	openDialog,
	closeDialog,
	confirmDiscard,
	showToast,
	dismissToast,
} = uiSlice.actions
export default uiSlice.reducer
