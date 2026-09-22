import { BrushTool } from "engine/tools/BrushTool"
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
 * live instances, not constants: building them in `common/constant.ts`, which
 * the tools import, would close a cycle onto a class still being defined.
 */
export const TOOLS: Partial<Record<ToolId, Tool>> = {
	pencil: new PencilTool(),
	brush: new BrushTool(),
	eraser: new EraserTool(),
	fill: new FillTool(),
	picker: new PickerTool(),
	magnifier: new MagnifierTool(),
	shape: new ShapeTool(),
	text: new TextTool(),
	"select-rect": new SelectTool("select-rect"),
	"select-free": new SelectTool("select-free"),
}
