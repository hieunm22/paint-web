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
	private overlayPainted = false
	private busy = false

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
		// a deferred fill still owns the undo snapshot; a second gesture would
		// clear it out from under the worker
		if (this.busy) return
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

	/**
	 * the pointer moved over the canvas without drawing. `screen` is in overlay
	 * css pixels; passing null clears whatever guidance was on show.
	 */
	hover(image: Point | null, screen: Point | null): void {
		const tool = TOOLS[store.getState().tool.active]
		const ctx = this.context()
		if (!tool?.paintOverlay || !ctx || !image || !screen) {
			if (this.overlayPainted) this.clearOverlay()
			return
		}

		this.surface.clearOverlay()
		tool.paintOverlay(screen, ctx)
		this.overlayPainted = true
	}

	clearOverlay(): void {
		this.surface.clearOverlay()
		this.overlayPainted = false
	}

	/** true while work handed over by a tool is still running. */
	get isBusy(): boolean {
		return this.busy
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
	/**
	 * a tool handed back work that finishes after the gesture. the step is
	 * pushed when it settles: the tool marks its own pixels dirty first.
	 */
	private deferStep(label: string, work: Promise<void>): void {
		this.busy = true
		work
			.catch(() => undefined)
			.finally(() => {
				this.busy = false
				if (this.history.commitStroke(label)) this.markUnsaved()
			})
	}

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
		const overlay = surface.overlayContext
		if (!base || !preview || !overlay) return null

		const state = store.getState()
		return {
			base,
			preview,
			overlay,
			overlaySize: surface.overlaySize,
			surface,
			color1: state.colors.color1,
			color2: state.colors.color2,
			size: state.tool.size,
			zoom: state.view.zoom,
			doc: surface.documentSize,
			dispatch: store.dispatch,
			markDirty: (rect) => this.history.touch(rect),
			defer: (label, work) => this.deferStep(label, work),
		}
	}
}

export const paint = new PaintEngine()
