import { History } from "engine/History"
import { reportSelectionBox } from "engine/overlay"
import { SelectionManager } from "engine/SelectionManager"
import { Surface } from "engine/Surface"
import { TOOLS } from "engine/tools/registry"
import { translate } from "locales/translate"
import { store } from "store"
import { historyChanged } from "store/actions"
import { setDirty } from "store/slices/docSlice"
import { clearSelection, setSelection } from "store/slices/selectionSlice"
import { setTool } from "store/slices/toolSlice"
import type {
	Modifiers,
	Size,
	SurfaceLayers,
	Tool,
	ToolContext,
} from "types/engine.types"
import type { Point, Rect } from "types/store.types"

const EMPTY: Size = { width: 0, height: 0 }

/** the settings a held shape or selection is redrawn from. */
interface Watched {
	tool: string
	shape: string
	color1: string
	color2: string
	size: number
	outline: string
	fill: string
	transparent: boolean
}

function watched(): Watched {
	const state = store.getState()
	return {
		tool: state.tool.active,
		shape: state.tool.shape,
		color1: state.colors.color1,
		color2: state.colors.color2,
		size: state.tool.size,
		outline: state.tool.outline,
		fill: state.tool.fill,
		transparent: state.selection.transparent,
	}
}

function sameRect(a: Rect | null, b: Rect | null): boolean {
	if (!a || !b) return a === b

	return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h
}

/**
 * the one object the pointer talks to. it reads the store for tool, colour and
 * size, then drives surface and history; a move never goes back through react.
 */
class PaintEngine {
	readonly surface = new Surface()
	readonly selection = new SelectionManager()
	private history = new History(this.surface, () => this.publishHistory())
	private active: Tool | null = null
	/** a tool holding an object on preview between gestures. */
	private held: Tool | null = null
	/** names the step a held object will push, where the tool's name is wrong. */
	private heldLabel: string | null = null
	private docSize: Size = EMPTY
	private secondary = false
	private overlayPainted = false
	private busy = false
	private settings = watched()

	constructor() {
		store.subscribe(() => this.onStoreChanged())
	}

	get isDrawing(): boolean {
		return this.active !== null
	}

	attach(layers: SurfaceLayers): void {
		this.surface.attach(layers)
	}

	detach(): void {
		this.cancel()
		this.discardHeld()
		this.surface.detach()
	}

	/** the tile grid follows the document, so a real size change drops history. */
	resizeDocument(size: Size): void {
		this.surface.resizeDocument(size)
		const same =
			size.width === this.docSize.width && size.height === this.docSize.height
		if (same) return

		this.docSize = size
		this.discardHeld()
		this.history.clear()
	}

	/**
	 * replaces the document with a decoded file. the tile grid and every step
	 * on the stack belong to the picture that just went away.
	 */
	loadImage(bitmap: ImageBitmap): void {
		const size = { width: bitmap.width, height: bitmap.height }
		this.cancel()
		this.discardHeld()
		this.surface.resizeDocument(size)
		this.docSize = size
		this.surface.clearDocument()
		this.surface.baseContext?.drawImage(bitmap, 0, 0)
		this.history.clear()
	}

	/** blank paper at the given size, which is what New leaves behind. */
	newDocument(size: Size): void {
		this.cancel()
		this.discardHeld()
		this.surface.resizeDocument(size)
		this.docSize = size
		this.surface.clearDocument()
		this.history.clear()
	}

	/** a pasted picture arrives as a floating selection, ready to be moved. */
	pasteBitmap(bitmap: ImageBitmap): void {
		const tool = TOOLS["select-rect"]
		const ctx = this.context()
		if (!tool || !ctx) return

		store.dispatch(setTool("select-rect"))
		this.hold(tool)
		this.heldLabel = translate("history.label.paste")
		this.selection.adopt(ctx, bitmap)
		reportSelectionBox(this.selection.bounds, this.selection.lasso)
		this.syncSelection()
	}

	/** the committed bitmap in full, which is what a save encodes. */
	readDocument(): ImageData | null {
		this.commitHeld()
		const { width, height } = this.surface.documentSize
		if (!width || !height) return null

		return this.surface.readRegion({ x: 0, y: 0, w: width, h: height })
	}

	begin(pt: Point, mods: Modifiers): void {
		// a deferred fill still owns the undo snapshot; a second gesture would
		// clear it out from under the worker
		if (this.busy) return
		this.cancel()

		const tool = TOOLS[store.getState().tool.active]
		const ctx = this.context()
		if (!tool || !ctx) return

		// a click away from what a tool is holding bakes it before anything else
		if (this.held && (this.held !== tool || !this.held.hitTest?.(pt, ctx))) {
			this.commitHeld()
		}
		if (!this.held) this.history.beginStroke()

		this.active = tool
		this.secondary = mods.secondary
		tool.begin(pt, mods, ctx)
	}

	update(pts: Point[], mods: Modifiers): void {
		const ctx = this.context()
		if (!this.active || !ctx || !pts.length) return

		this.active.update?.(pts, this.withButton(mods), ctx)
	}

	end(pt: Point, mods: Modifiers): void {
		const tool = this.active
		const ctx = this.context()
		if (!tool || !ctx) return

		this.active = null
		tool.end?.(pt, this.withButton(mods), ctx)

		// a shape or a selection stays on preview until something bakes it
		if (tool.isPending?.(ctx)) {
			this.held = tool
			this.syncSelection()
			return
		}

		this.held = null
		// a tool that painted nothing, such as the picker, leaves no step behind
		if (!this.history.hasPending) {
			this.surface.clearPreview()
			this.syncSelection()
			return
		}

		this.surface.commitPreview()
		if (this.history.commitStroke(tool.label)) this.markUnsaved()
		this.syncSelection()
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

	/** true while a shape or a selection is waiting to be baked. */
	get hasHeld(): boolean {
		return this.held !== null
	}

	/** drops a gesture in progress, for a tool change or a lost pointer. */
	cancel(): void {
		const tool = this.active
		if (!tool) return

		this.active = null
		const ctx = this.context()
		if (!ctx) return

		// what the tool holds survives a lost pointer; only the gesture ends
		if (this.held === tool) {
			tool.repaint?.(ctx)
			return
		}

		tool.cancel?.(ctx)
		this.surface.clearPreview()
		this.history.cancelStroke()
	}

	/** bakes the held shape or selection, which Enter and a click away do. */
	commitHeld(): void {
		const tool = this.held
		if (!tool) return

		this.held = null
		const label = this.heldLabel ?? tool.label
		this.heldLabel = null
		const ctx = this.context()
		if (!ctx) return

		tool.commit?.(ctx)
		this.surface.commitPreview()
		if (this.history.commitStroke(label)) this.markUnsaved()
		this.syncSelection()
	}

	/** Escape: the held object goes away and the pixels it lifted come back. */
	discardHeld(): void {
		const tool = this.held
		if (!tool) return

		this.held = null
		this.heldLabel = null
		this.history.rollbackStroke()
		const ctx = this.context()
		if (ctx) tool.cancel?.(ctx)
		this.surface.clearPreview()
		reportSelectionBox(null)
		this.syncSelection()
	}

	selectAll(): void {
		const tool = TOOLS["select-rect"]
		const { width, height } = this.surface.documentSize
		if (!tool || !width || !height) return

		store.dispatch(setTool("select-rect"))
		this.hold(tool)
		this.selection.define("rect", { x: 0, y: 0, w: width, h: height }, null)
		reportSelectionBox(this.selection.bounds, this.selection.lasso)
		this.syncSelection()
	}

	/** swaps what is picked for what is not, which needs a free-form mask. */
	invertSelection(): void {
		const ctx = this.context()
		if (!ctx || !this.selection.isActive) return
		if (this.selection.isFloating) this.commitHeld()

		// the held tool keeps holding: handing over to another one would drop
		// the very region being inverted
		const tool = this.held ?? TOOLS["select-rect"]
		if (!this.selection.isActive || !tool) {
			this.selectAll()
			return
		}

		this.hold(tool)
		this.selection.invert(ctx)
		reportSelectionBox(this.selection.bounds, this.selection.lasso)
		this.syncSelection()
	}

	/** the selected pixels, for a copy. floating ones are read off the buffer. */
	readSelection(): ImageData | null {
		const ctx = this.context()
		return ctx && this.selection.isActive ? this.selection.read(ctx) : null
	}

	/** Delete and the second half of Cut: the region goes back to colour 2. */
	deleteSelection(): void {
		const ctx = this.context()
		if (!ctx || !this.selection.isActive) return

		// pixels already lifted left their hole behind when they came up
		if (!this.selection.isFloating) this.selection.erase(ctx)
		this.held = null
		this.selection.clear()
		this.surface.clearPreview()
		reportSelectionBox(null)
		if (this.history.commitStroke(translate("history.label.delete"))) {
			this.markUnsaved()
		}
		this.syncSelection()
	}

	/** arrow keys: the pixels come up on the first nudge, as in Paint. */
	nudgeSelection(dx: number, dy: number): void {
		const tool = this.held ?? TOOLS["select-rect"]
		const ctx = this.context()
		if (!tool || !ctx || !this.selection.isActive) return

		this.hold(tool)
		if (!this.selection.isFloating) this.selection.lift(ctx, true)
		this.selection.moveBy(ctx, dx, dy)
		reportSelectionBox(this.selection.bounds, this.selection.lasso)
		this.syncSelection()
	}

	undo(): void {
		// the held object is the newest thing on screen; Ctrl+Z drops that first
		if (this.held) {
			this.discardHeld()
			return
		}
		if (this.history.undo()) this.markUnsaved()
	}

	redo(): void {
		if (this.history.redo()) this.markUnsaved()
	}

	/**
	 * starts holding `tool`, opening an undo step unless one is already open
	 * for it. everything a held object writes belongs to that one step.
	 */
	private hold(tool: Tool): void {
		if (this.held !== tool) {
			this.commitHeld()
			this.history.beginStroke()
			this.heldLabel = null
		}
		this.held = tool
	}

	/**
	 * a tool change bakes what is held; a colour, size or style change redraws
	 * it, which is what makes a dropped shape still editable.
	 */
	private onStoreChanged(): void {
		const next = watched()
		const prev = this.settings
		this.settings = next
		if (!this.held) return

		if (next.tool !== prev.tool || next.shape !== prev.shape) {
			this.commitHeld()
			return
		}
		if (
			next.color1 === prev.color1 &&
			next.color2 === prev.color2 &&
			next.size === prev.size &&
			next.outline === prev.outline &&
			next.fill === prev.fill &&
			next.transparent === prev.transparent
		) {
			return
		}

		const ctx = this.context()
		if (ctx) this.held.repaint?.(ctx)
	}

	/** the store learns about the selection at rest; the ants do not wait. */
	private syncSelection(): void {
		const { kind, bounds } = this.selection
		const current = store.getState().selection

		if (kind === "none" || !bounds) {
			if (current.kind !== "none") store.dispatch(clearSelection())
			return
		}
		if (current.kind === kind && sameRect(current.bounds, bounds)) return

		store.dispatch(setSelection({ kind, bounds }))
	}

	/**
	 * which button started the gesture: a move event reports no button at all,
	 * and a drag that began on the right one keeps painting colour 2.
	 */
	private withButton(mods: Modifiers): Modifiers {
		return { ...mods, secondary: this.secondary }
	}

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
			shape: state.tool.shape,
			outline: state.tool.outline,
			fill: state.tool.fill,
			transparent: state.selection.transparent,
			doc: surface.documentSize,
			selection: this.selection,
			dispatch: store.dispatch,
			markDirty: (rect) => this.history.touch(rect),
			defer: (label, work) => this.deferStep(label, work),
		}
	}
}

export const paint = new PaintEngine()
