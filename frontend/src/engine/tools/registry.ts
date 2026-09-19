import type { ToolId } from "store/types"
import type { Tool } from "../types"
import { EraserTool } from "./EraserTool"
import { FillTool } from "./FillTool"
import { MagnifierTool } from "./MagnifierTool"
import { PencilTool } from "./PencilTool"
import { PickerTool } from "./PickerTool"

/**
 * the tools that draw today. brushes, shapes, selection and text are later
 * phases: picking one of those leaves the canvas untouched.
 */
export const TOOLS: Partial<Record<ToolId, Tool>> = {
	pencil: new PencilTool(),
	eraser: new EraserTool(),
	fill: new FillTool(),
	picker: new PickerTool(),
	magnifier: new MagnifierTool(),
}
