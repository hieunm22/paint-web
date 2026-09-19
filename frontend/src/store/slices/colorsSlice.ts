import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { CUSTOM_SLOTS, PAINT_PALETTE } from "engine/color"
import { pickerPicked } from "../actions"
import type { ColorSlotId, ColorState, PickedColor } from "../types"

const initialState: ColorState = {
	color1: "#000000",
	color2: "#ffffff",
	editing: "color1",
	palette: PAINT_PALETTE,
	custom: Array.from({ length: CUSTOM_SLOTS }, () => null),
}

const colorsSlice = createSlice({
	name: "colors",
	initialState,
	reducers: {
		setEditingSwatch(state, action: PayloadAction<ColorSlotId>) {
			state.editing = action.payload
		},
		/** assigns a color to whichever slot is currently being edited. */
		applyColor(state, action: PayloadAction<string>) {
			state[state.editing] = action.payload
		},
		setColor(state, action: PayloadAction<PickedColor>) {
			state[action.payload.which] = action.payload.hex
		},
		/** fills the first empty custom slot, overwriting FIFO when full. */
		addCustomColor(state, action: PayloadAction<string>) {
			const free = state.custom.indexOf(null)
			if (free >= 0) state.custom[free] = action.payload
			else {
				state.custom.shift()
				state.custom.push(action.payload)
			}
		},
	},
	extraReducers: (builder) => {
		builder.addCase(pickerPicked, (state, action) => {
			state[action.payload.which] = action.payload.hex
		})
	},
})

export const { setEditingSwatch, applyColor, setColor, addCustomColor } =
	colorsSlice.actions
export default colorsSlice.reducer
