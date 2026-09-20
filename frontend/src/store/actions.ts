import { createAction } from "@reduxjs/toolkit"
import type { PickedColor } from "types/store.types"

/**
 * the colour picker writes one swatch and hands the previous tool back, which
 * two slices have to react to; a shared action keeps that in one dispatch.
 */
export const pickerPicked = createAction<PickedColor>("picker/picked")

/** engine to store: the undo and redo stacks changed depth. */
export const historyChanged = createAction<{
	canUndo: boolean
	canRedo: boolean
}>("history/changed")
