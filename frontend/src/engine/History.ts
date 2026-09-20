import type { Surface } from "engine/Surface"
import type {
	HistoryEntry,
	HistoryFull,
	HistoryTiles,
	Size,
} from "types/engine.types"
import type { Rect } from "types/store.types"

/** a stroke usually dirties four of these, so a step costs about 1 MB. */
const TILE = 256
const LIMIT = 50

const EMPTY: Size = { width: 0, height: 0 }

/**
 * undo on tiles rather than whole-canvas snapshots: 50 steps of 1920x1080
 * would cost 415 MB. only a change of size falls back to a full one.
 */
export class History {
	private undoStack: HistoryEntry[] = []
	private redoStack: HistoryEntry[] = []
	private backup = new Map<number, ImageData>()
	/** the document size the pending backup was cut against. */
	private cutAt: Size = EMPTY

	constructor(
		private surface: Surface,
		private onChange: () => void,
		/** a full step restored the picture at another size; the store follows. */
		private onResize: (size: Size) => void,
	) {}

	get canUndo(): boolean {
		return this.undoStack.length > 0
	}

	get canRedo(): boolean {
		return this.redoStack.length > 0
	}

	/** true once the current gesture has snapshotted something. */
	get hasPending(): boolean {
		return this.backup.size > 0
	}

	beginStroke(): void {
		this.backup.clear()
		this.cutAt = this.surface.documentSize
	}

	/** a tool calls this before writing to an area; the first call wins. */
	touch(rect: Rect): void {
		if (!this.backup.size) this.cutAt = this.surface.documentSize

		for (const id of this.tilesIn(rect, this.cutAt)) {
			if (this.backup.has(id)) continue

			const data = this.readTile(id, this.cutAt)
			if (data) this.backup.set(id, data)
		}
	}

	/** pushes the gesture as one step. returns false when nothing changed. */
	commitStroke(label: string): boolean {
		if (!this.backup.size) return false

		this.push({
			label,
			kind: "tiles",
			docSize: this.cutAt,
			tiles: this.backup,
		})
		this.backup = new Map()
		return true
	}

	/**
	 * a whole-bitmap step, taken before an operation that changes the document
	 * size: the tile grid of every other step belongs to one size of paper.
	 */
	pushFull(label: string, image: ImageData): void {
		this.push({ label, kind: "full", image })
	}

	cancelStroke(): void {
		this.backup.clear()
	}

	/**
	 * puts the snapshotted pixels back and drops the stroke. this is Escape on
	 * a floating selection, which never becomes a step of its own.
	 */
	rollbackStroke(): void {
		for (const [id, data] of this.backup) this.writeTile(id, data, this.cutAt)
		this.backup.clear()
	}

	undo(): boolean {
		const entry = this.undoStack.pop()
		if (!entry) return false

		this.redoStack.push(this.swap(entry))
		this.onChange()
		return true
	}

	redo(): boolean {
		const entry = this.redoStack.pop()
		if (!entry) return false

		this.undoStack.push(this.swap(entry))
		this.onChange()
		return true
	}

	/** a new picture altogether: nothing on the stacks describes it any more. */
	clear(): void {
		this.undoStack = []
		this.redoStack = []
		this.backup.clear()
		this.onChange()
	}

	private push(entry: HistoryEntry): void {
		this.undoStack.push(entry)
		if (this.undoStack.length > LIMIT) this.undoStack.shift()
		// a new branch invalidates everything that was undone
		this.redoStack.length = 0
		this.onChange()
	}

	/** restores an entry and returns the pixels it replaced, ready to go back. */
	private swap(entry: HistoryEntry): HistoryEntry {
		return entry.kind === "full" ? this.swapFull(entry) : this.swapTiles(entry)
	}

	private swapTiles(entry: HistoryTiles): HistoryTiles {
		const tiles = new Map<number, ImageData>()

		for (const [id, data] of entry.tiles) {
			const current = this.readTile(id, entry.docSize)
			if (current) tiles.set(id, current)
			this.writeTile(id, data, entry.docSize)
		}

		return { ...entry, tiles }
	}

	private swapFull(entry: HistoryFull): HistoryFull {
		const { width, height } = this.surface.documentSize
		const current = this.surface.readRegion({ x: 0, y: 0, w: width, h: height })
		if (!current) return entry

		this.surface.restoreDocument(entry.image)
		this.onResize(this.surface.documentSize)
		return { ...entry, image: current }
	}

	private colsOf(doc: Size): number {
		return Math.max(1, Math.ceil(doc.width / TILE))
	}

	private tilesIn(rect: Rect, doc: Size): number[] {
		const cols = this.colsOf(doc)
		const x0 = Math.max(0, Math.floor(rect.x / TILE))
		const y0 = Math.max(0, Math.floor(rect.y / TILE))
		const x1 = Math.min(cols - 1, Math.floor((rect.x + rect.w - 1) / TILE))
		const rows = Math.max(1, Math.ceil(doc.height / TILE))
		const y1 = Math.min(rows - 1, Math.floor((rect.y + rect.h - 1) / TILE))

		const ids: number[] = []
		for (let ty = y0; ty <= y1; ty++) {
			for (let tx = x0; tx <= x1; tx++) ids.push(ty * cols + tx)
		}
		return ids
	}

	/** edge tiles are cut short rather than padded past the document. */
	private tileRect(id: number, doc: Size): Rect | null {
		const cols = this.colsOf(doc)
		const x = (id % cols) * TILE
		const y = Math.floor(id / cols) * TILE
		const w = Math.min(TILE, doc.width - x)
		const h = Math.min(TILE, doc.height - y)
		if (w <= 0 || h <= 0) return null

		return { x, y, w, h }
	}

	private readTile(id: number, doc: Size): ImageData | null {
		const rect = this.tileRect(id, doc)
		return rect ? this.surface.readRegion(rect) : null
	}

	private writeTile(id: number, data: ImageData, doc: Size): void {
		const rect = this.tileRect(id, doc)
		if (rect) this.surface.writeRegion(data, rect.x, rect.y)
	}
}
