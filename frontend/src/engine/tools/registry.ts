import { EraserTool } from "engine/tools/EraserTool"
import { FillTool } from "engine/tools/FillTool"
import { MagnifierTool } from "engine/tools/MagnifierTool"
import { PencilTool } from "engine/tools/PencilTool"
import { PickerTool } from "engine/tools/PickerTool"
import { SelectTool } from "engine/tools/SelectTool"
import { ShapeTool } from "engine/tools/ShapeTool"
import { TextTool } from "engine/tools/TextTool"
import type { Tool } from "types/engine.types"
import type { ToolId } from "types/store.types"

/**
 * live tool instances rather than constant values, which is why they are not
 * in `common/constant.ts`: that file is imported by the tools themselves, and
 * building them there closes a module cycle onto a class still being defined.
 */
export const TOOLS: Partial<Record<ToolId, Tool>> = {
	pencil: new PencilTool(),
	eraser: new EraserTool(),
	fill: new FillTool(),
	picker: new PickerTool(),
	magnifier: new MagnifierTool(),
	shape: new ShapeTool(),
	text: new TextTool(),
	"select-rect": new SelectTool("select-rect"),
	"select-free": new SelectTool("select-free"),
}
