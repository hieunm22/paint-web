import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import {
	DEFAULT_PRINT_SETUP,
	MAX_MARGIN,
	MAX_PRINT_SCALE,
} from "common/constant"
import type {
	CenteringEdit,
	MarginEdit,
	PageOrientation,
	PaperSize,
	PrintSetup,
} from "types/store.types"

const initialState: PrintSetup = {
	...DEFAULT_PRINT_SETUP,
	margins: { ...DEFAULT_PRINT_SETUP.margins },
}

function whole(value: number, max: number): number {
	if (!Number.isFinite(value)) return 0

	const rounded = Math.round(value)
	const capped = Math.min(max, rounded)

	return Math.max(0, capped)
}

const printSlice = createSlice({
	name: "print",
	initialState,
	reducers: {
		setCentering(state, action: PayloadAction<CenteringEdit>) {
			state[action.payload.axis] = action.payload.on
		},
		setFit(state, action: PayloadAction<boolean>) {
			state.fit = action.payload
		},
		setMargin(state, action: PayloadAction<MarginEdit>) {
			const { edge, value } = action.payload
			state.margins[edge] = whole(value, MAX_MARGIN)
		},
		setOrientation(state, action: PayloadAction<PageOrientation>) {
			state.orientation = action.payload
		},
		setPaper(state, action: PayloadAction<PaperSize>) {
			state.paper = action.payload
		},
		setScale(state, action: PayloadAction<number>) {
			state.scale = whole(action.payload, MAX_PRINT_SCALE)
		},
	},
})

export const {
	setCentering,
	setFit,
	setMargin,
	setOrientation,
	setPaper,
	setScale,
} = printSlice.actions
export default printSlice.reducer
