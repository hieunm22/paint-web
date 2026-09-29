import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { QAT_ORDER } from "common/constant"
import { readSettings } from "common/settings"
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
	ribbon: "open",
	openMenu: null,
	dialog: null,
	pending: null,
	toast: null,
	draggingFile: false,
	qat: readSettings().qat,
}

const uiSlice = createSlice({
	name: "ui",
	initialState,
	reducers: {
		closeBackstage(state) {
			state.backstageOpen = false
		},
		closeDialog(state) {
			state.dialog = null
			state.pending = null
		},
		closeMenu(state) {
			state.openMenu = null
		},
		/** the minimise caret. */
		collapseRibbon(state) {
			state.ribbon = "collapsed"
		},
		/** asks about unsaved work, remembering what it is holding back. */
		confirmDiscard(state, action: PayloadAction<PendingFileAction>) {
			state.dialog = "confirm-discard"
			state.pending = action.payload
			state.openMenu = null
			state.backstageOpen = false
		},
		dismissToast(state) {
			state.toast = null
		},
		endFileDrag(state) {
			state.draggingFile = false
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
		openDialog(state, action: PayloadAction<DialogId>) {
			state.dialog = action.payload
			state.openMenu = null
			state.backstageOpen = false
		},
		/** a tab clicked while minimised stands the ribbon over the canvas. */
		peekRibbon(state) {
			state.ribbon = "peek"
		},
		/** the pin caret, which gives the ribbon its own room back. */
		pinRibbon(state) {
			state.ribbon = "open"
		},
		setTab(state, action: PayloadAction<RibbonTabId>) {
			state.tab = action.payload
			if (action.payload !== "text") state.priorTab = action.payload
			state.backstageOpen = false
			state.openMenu = null
		},
		/** hovering a row opens its flyout, where a click would have toggled it. */
		showMenu(state, action: PayloadAction<string>) {
			state.openMenu = action.payload
		},
		/** a text box opened on the canvas: the Text tab appears and takes over. */
		showTextTab(state) {
			state.textTab = true
			state.tab = "text"
			state.backstageOpen = false
			state.openMenu = null
		},
		/** the payload is a translation key: the text follows the language. */
		showToast(state, action: PayloadAction<string>) {
			state.toast = action.payload
		},
		/** a picture is hovering over the window and the overlay says so. */
		startFileDrag(state) {
			state.draggingFile = true
		},
		toggleMenu(state, action: PayloadAction<string>) {
			state.openMenu = state.openMenu === action.payload ? null : action.payload
		},
		/** the fixed order decides where a re-added button lands, not the click. */
		toggleQat(state, action: PayloadAction<QatItemId>) {
			const id = action.payload
			const shown = state.qat.includes(id)
			state.qat = QAT_ORDER.filter(one =>
				one === id ? !shown : state.qat.includes(one),
			)
		},
	},
})

export const {
	closeBackstage,
	closeDialog,
	closeMenu,
	collapseRibbon,
	confirmDiscard,
	dismissToast,
	endFileDrag,
	hideTextTab,
	openBackstage,
	openDialog,
	peekRibbon,
	pinRibbon,
	setTab,
	showMenu,
	showTextTab,
	showToast,
	startFileDrag,
	toggleMenu,
	toggleQat,
} = uiSlice.actions
export default uiSlice.reducer
