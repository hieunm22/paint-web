import { store } from "store"
import { historyChanged } from "store/actions"
import { setDirty } from "store/slices/docSlice"
import type { Point } from "store/types"
import type { Modifiers, Size, SurfaceLayers, Tool, ToolContext } from "./types"
import { History } from "./History"
import { Surface } from "./Surface"
import { TOOLS } from "./tools/registry"

const EMPTY: Size = { width: 0, height: 0 }

/**
 * the one object the pointer talks to. it reads the store for tool, colour and
 * size, then drives surface and history; a move never goes back through react.
 */
class PaintEngine {
	readonly surface = new Surface()
	private history = new History(this.surface, () => this.publishHistory())
	private tool: Tool | null = null
	private docSize: Size = EMPTY
	private secondary = false

	get isDrawing(): boolean {
		return this.tool !== null
	}

	attach(layers: SurfaceLayers): void {
		this.surface.attach(layers)
	}

	detach(): void {
		this.cancel()
		this.surface.detach()
	}

	/** the tile grid follows the document, so a real size change drops history. */
	resizeDocument(size: Size): void {
		this.surface.resizeDocument(size)
		const same =
			size.width === this.docSize.width && size.height === this.docSize.height
		if (same) return

		this.docSize = size
		this.history.clear()
	}

	begin(pt: Point, mods: Modifiers): void {
		this.cancel()

		const tool = TOOLS[store.getState().tool.active]
		const ctx = this.context()
		if (!tool || !ctx) return

		this.tool = tool
		this.secondary = mods.secondary
		this.history.beginStroke()
		tool.begin(pt, mods, ctx)
	}

	update(pts: Point[], mods: Modifiers): void {
		const ctx = this.context()
		if (!this.tool || !ctx || !pts.length) return

		this.tool.update?.(pts, this.held(mods), ctx)
	}

	end(pt: Point, mods: Modifiers): void {
		const tool = this.tool
		const ctx = this.context()
		if (!tool || !ctx) return

		this.tool = null
		tool.end?.(pt, this.held(mods), ctx)
		// a tool that painted nothing, such as the picker, leaves no step behind
		if (!this.history.hasPending) {
			this.surface.clearPreview()
			return
		}

		this.surface.commitPreview()
		if (this.history.commitStroke(tool.label)) this.markUnsaved()
	}

	/** drops a gesture in progress, for a tool change or a lost pointer. */
	cancel(): void {
		const tool = this.tool
		if (!tool) return

		this.tool = null
		const ctx = this.context()
		if (ctx) tool.cancel?.(ctx)
		this.surface.clearPreview()
		this.history.cancelStroke()
	}

	undo(): void {
		if (this.history.undo()) this.markUnsaved()
	}

	redo(): void {
		if (this.history.redo()) this.markUnsaved()
	}

	/**
	 * which button started the gesture: a move event reports no button at all,
	 * and a drag that began on the right one keeps painting colour 2.
	 */
	private held(mods: Modifiers): Modifiers {
		return { ...mods, secondary: this.secondary }
	}

	/** the title bar shows a star until the document is saved. */
	private markUnsaved(): void {
		if (!store.getState().doc.isDirty) store.dispatch(setDirty(true))
	}

	private publishHistory(): void {
		store.dispatch(
			historyChanged({
				canUndo: this.history.canUndo,
				canRedo: this.history.canRedo,
			}),
		)
	}

	private context(): ToolContext | null {
		const { surface } = this
		const base = surface.baseContext
		const preview = surface.previewContext
		if (!base || !preview) return null

		const state = store.getState()
		return {
			base,
			preview,
			surface,
			color1: state.colors.color1,
			color2: state.colors.color2,
			size: state.tool.size,
			zoom: state.view.zoom,
			doc: surface.documentSize,
			dispatch: store.dispatch,
			markDirty: (rect) => this.history.touch(rect),
		}
	}
}

export const paint = new PaintEngine()
