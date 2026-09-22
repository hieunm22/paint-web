import { MAX_DIMENSION } from "common/constant"
import { TOOLS } from "engine/tools/registry"
import { announce } from "engine/announce"
import { fitsCanvas } from "engine/canvasLimit"
import { History } from "engine/History"
import { reportSelectionBox } from "engine/overlay"
import { SelectionManager } from "engine/SelectionManager"
import { Surface } from "engine/Surface"
import { TextTool } from "engine/tools/TextTool"
import {
	flipImage,
	padImage,
	rotateImage,
	transformedSize,
	transformImage,
} from "engine/transform"
import { translate } from "locales/translate"
import { store } from "store"
import { historyChanged } from "store/actions"
import { setDirty, setDocSize } from "store/slices/docSlice"
import { clearSelection, setSelection } from "store/slices/selectionSlice"
import { setTool } from "store/slices/toolSlice"
import { showToast } from "store/slices/uiSlice"
import type {
	FlipAxis,
	ImageRecipe,
	Modifiers,
	Size,
	StrokePoint,
	SurfaceLayers,
	Tool,
	ToolContext,
	TransformSpec,
} from "types/engine.types"
import type { Point, Rect } from "types/store.types"

const EMPTY: Size = { width: 0, height: 0 }

/** a paste lands in the top left corner of the paper, whatever is in view. */
const PASTE_CORNER: Point = { x: 0, y: 0 }

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
 * the one object the pointer talks to. it reads the store for tool, color and
 * size, then drives surface and history; a move never goes back through react.
 */
class PaintEngine {
	readonly surface = new Surface()
	readonly selection = new SelectionManager()
	private history = new History(
		this.surface,
		() => this.publishHistory(),
		size => this.adoptSize(size),
	)
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
		if (!tool) return

		// paper too small for the paste grows first, giving the picture room
		this.resizeCanvas(grownDocument(bitmap, this.surface.documentSize))

		const ctx = this.context()
		if (!ctx) return

		store.dispatch(setTool("select-rect"))
		this.hold(tool)
		this.heldLabel = translate("history.label.paste")
		this.selection.adopt(ctx, bitmap, PASTE_CORNER)
		reportSelectionBox(this.selection.bounds, this.selection.lasso)
		this.syncSelection()
	}

	/** Crop: the picture becomes whatever the selection box holds. */
	crop(): void {
		const ctx = this.context()
		if (!ctx || !this.selection.isActive) return

		// read the pixels while the selection is still there to describe them
		const cropped = this.selection.crop(ctx)
		if (!cropped) return

		this.commitHeld()
		this.replaceDocument(cropped, translate("history.label.crop"))
	}

	/** quarter turns clockwise, on the selection when one is up. */
	rotate(turns: number): void {
		this.recompose(
			source => rotateImage(source, turns),
			translate("history.label.rotate"),
		)
	}

	flip(axis: FlipAxis): void {
		this.recompose(
			source => flipImage(source, axis),
			translate("history.label.flip"),
		)
	}

	/**
	 * a handle drag on the paper's edge: it grows or crops the document and
	 * never scales the picture, which stays in the corner it was drawn in.
	 */
	resizeCanvas(size: Size): void {
		const current = this.surface.documentSize
		if (size.width === current.width && size.height === current.height) return
		if (!this.canBack(size)) return

		this.commitHeld()
		const source = this.surface.snapshot()
		if (!source) return

		this.replaceDocument(
			padImage(source, size),
			translate("history.label.canvas"),
		)
	}

	/** Resize and Skew, on the selection when one is up. */
	transform(spec: TransformSpec): void {
		// stretching the whole picture is what can outgrow the browser's canvas
		if (
			!this.selection.isActive &&
			!this.canBack(transformedSize(this.surface.documentSize, spec))
		) {
			return
		}

		this.recompose(
			source => transformImage(source, spec),
			translate("history.label.resize"),
		)
	}

	/** what the textarea over the canvas is holding, ready to be baked. */
	setTextValue(value: string): void {
		this.textTool?.setValue(value)
	}

	/** the textarea outgrew its box and the box follows it down. */
	growTextBox(height: number): void {
		this.textTool?.growTo(height)
	}

	/** drags the open text box to a new corner, kept on the paper. */
	moveTextBox(x: number, y: number): void {
		const tool = this.textTool
		const box = tool?.bounds
		if (!tool || !box) return

		const { width, height } = this.surface.documentSize
		tool.moveTo(
			Math.max(0, Math.min(Math.round(x), width - box.w)),
			Math.max(0, Math.min(Math.round(y), height - box.h)),
		)
	}

	/** the committed bitmap in full, which is what a save encodes. */
	readDocument(): ImageData | null {
		this.commitHeld()
		const { width, height } = this.surface.documentSize
		if (!width || !height) return null

		return this.surface.readRegion({ x: 0, y: 0, w: width, h: height })
	}

	begin(pt: StrokePoint, mods: Modifiers): void {
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
		this.surface.flush()
	}

	update(pts: StrokePoint[], mods: Modifiers): void {
		const ctx = this.context()
		if (!this.active || !ctx || !pts.length) return

		this.active.update?.(pts, this.withButton(mods), ctx)
		// a windowed document shows the stroke on this frame rather than the next
		this.surface.flush()
	}

	end(pt: StrokePoint, mods: Modifiers): void {
		const tool = this.active
		const ctx = this.context()
		if (!tool || !ctx) return

		this.active = null
		tool.end?.(pt, this.withButton(mods), ctx)

		// a shape or a selection stays on preview until something bakes it
		if (tool.isPending?.(ctx)) {
			this.held = tool
			this.syncSelection()
			this.surface.flush()
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
		if (!tool || !ctx || !image || !screen) {
			this.clearOverlay()
			return
		}

		// a handle wants the arrow it drags along, which no drawn glyph shows
		this.surface.setCursor(tool.cursorAt?.(image, ctx) ?? "")
		if (!tool.paintOverlay) {
			if (this.overlayPainted) this.surface.clearOverlay()
			this.overlayPainted = false
			return
		}

		this.surface.clearOverlay()
		tool.paintOverlay(screen, ctx)
		this.overlayPainted = true
	}

	clearOverlay(): void {
		this.surface.clearOverlay()
		this.surface.setCursor("")
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
			this.surface.flush()
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

	/**
	 * Escape and a second click on Select makes the marquee goes away.
	 * returns false when nothing was selected.
	 */
	deselect(): boolean {
		if (!this.selection.isActive) return false

		if (this.held) {
			this.commitHeld()
			return true
		}

		this.selection.clear()
		this.surface.clearPreview()
		reportSelectionBox(null)
		this.syncSelection()
		return true
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

	/** Delete and the second half of Cut: the region goes back to color 2. */
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

	private get textTool(): TextTool | null {
		const tool = TOOLS.text
		return tool instanceof TextTool ? tool : null
	}

	/**
	 * rotate, flip and resize all work the same way: over the floating pixels
	 * when a selection is up, over the whole picture when none is.
	 */
	private recompose(make: ImageRecipe, label: string): void {
		const ctx = this.context()
		if (!ctx) return

		if (this.selection.isActive) {
			const tool = this.held ?? TOOLS["select-rect"]
			if (!tool) return

			this.hold(tool)
			this.selection.reshape(ctx, make)
			reportSelectionBox(this.selection.bounds, this.selection.lasso)
			this.syncSelection()
			return
		}

		this.commitHeld()
		const source = this.surface.snapshot()
		if (source) this.replaceDocument(make(source), label)
	}

	/**
	 * swaps the whole picture for another one of any size. the old bitmap goes
	 * on the stack whole: a tile id means nothing once the grid is recut.
	 */
	private replaceDocument(source: HTMLCanvasElement, label: string): void {
		const { width, height } = this.surface.documentSize
		const before = this.surface.readRegion({ x: 0, y: 0, w: width, h: height })

		this.surface.replaceDocument(source)
		this.surface.clearPreview()
		this.docSize = this.surface.documentSize
		if (before) this.history.pushFull(label, before)
		store.dispatch(setDocSize(this.docSize))
		announce("live.image.size", {
			0: this.docSize.width,
			1: this.docSize.height,
		})
	}

	/** an undone size change resized the surface; the store catches up to it. */
	private adoptSize(size: Size): void {
		this.docSize = size
		store.dispatch(setDocSize(size))
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
	 * a tool change bakes what is held; a color, size or style change redraws
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
		this.surface.flush()
	}

	/** the store learns about the selection at rest; the ants do not wait. */
	private syncSelection(): void {
		const { kind, bounds } = this.selection
		const current = store.getState().selection

		if (kind === "none" || !bounds) {
			if (current.kind === "none") return

			store.dispatch(clearSelection())
			announce("live.selection.none")
			return
		}
		if (current.kind === kind && sameRect(current.bounds, bounds)) return

		store.dispatch(setSelection({ kind, bounds }))
		announce("live.selection.size", { 0: bounds.w, 1: bounds.h })
	}

	/**
	 * which button started the gesture: a move event reports no button at all,
	 * and a drag that began on the right one keeps painting color 2.
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

	/** a picture the browser cannot hold is refused before anything is lost. */
	private canBack(size: Size): boolean {
		if (fitsCanvas(size)) return true

		store.dispatch(showToast("toast.file.over-canvas-limit"))
		return false
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
			brush: state.tool.brush,
			outline: state.tool.outline,
			fill: state.tool.fill,
			transparent: state.selection.transparent,
			text: state.tool.text,
			doc: surface.documentSize,
			selection: this.selection,
			dispatch: store.dispatch,
			markDirty: rect => this.history.touch(rect),
			defer: (label, work) => this.deferStep(label, work),
		}
	}
}

/** the paper a paste needs: never smaller than it was, never past the limit. */
function grownDocument(bitmap: ImageBitmap, doc: Size): Size {
	return {
		width: Math.min(MAX_DIMENSION, Math.max(doc.width, bitmap.width)),
		height: Math.min(MAX_DIMENSION, Math.max(doc.height, bitmap.height)),
	}
}

export const paint = new PaintEngine()
