import type { Rect } from "store/types"
import type { HistoryEntry } from "./types"
import type { Surface } from "./Surface"

/** a stroke usually dirties four of these, so a step costs about 1 MB. */
const TILE = 256
const LIMIT = 50

/**
 * undo built on tiles rather than whole-canvas snapshots: 50 steps of a full
 * 1920x1080 ImageData would be 415 MB, which the memory budget rules out.
 */
export class History {
	private undoStack: HistoryEntry[] = []
	private redoStack: HistoryEntry[] = []
	private backup = new Map<number, ImageData>()

	constructor(
		private surface: Surface,
		private onChange: () => void,
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
	}

	/** a tool calls this before writing to an area; the first call wins. */
	touch(rect: Rect): void {
		for (const id of this.tilesIn(rect)) {
			if (this.backup.has(id)) continue

			const data = this.readTile(id)
			if (data) this.backup.set(id, data)
		}
	}

	/** pushes the gesture as one step. returns false when nothing changed. */
	commitStroke(label: string): boolean {
		if (!this.backup.size) return false

		this.undoStack.push({ label, tiles: this.backup })
		this.backup = new Map()
		if (this.undoStack.length > LIMIT) this.undoStack.shift()
		// a new branch invalidates everything that was undone
		this.redoStack.length = 0
		this.onChange()
		return true
	}

	cancelStroke(): void {
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

	/** the tile grid follows the document size, which a resize invalidates. */
	clear(): void {
		this.undoStack = []
		this.redoStack = []
		this.backup.clear()
		this.onChange()
	}

	/** restores an entry and returns the pixels it replaced, ready to go back. */
	private swap(entry: HistoryEntry): HistoryEntry {
		const tiles = new Map<number, ImageData>()

		for (const [id, data] of entry.tiles) {
			const current = this.readTile(id)
			if (current) tiles.set(id, current)
			this.writeTile(id, data)
		}

		return { label: entry.label, tiles }
	}

	private get cols(): number {
		return Math.max(1, Math.ceil(this.surface.documentSize.width / TILE))
	}

	private tilesIn(rect: Rect): number[] {
		const doc = this.surface.documentSize
		const x0 = Math.max(0, Math.floor(rect.x / TILE))
		const y0 = Math.max(0, Math.floor(rect.y / TILE))
		const x1 = Math.min(this.cols - 1, Math.floor((rect.x + rect.w - 1) / TILE))
		const rows = Math.max(1, Math.ceil(doc.height / TILE))
		const y1 = Math.min(rows - 1, Math.floor((rect.y + rect.h - 1) / TILE))

		const ids: number[] = []
		for (let ty = y0; ty <= y1; ty++) {
			for (let tx = x0; tx <= x1; tx++) ids.push(ty * this.cols + tx)
		}
		return ids
	}

	/** edge tiles are cut short rather than padded past the document. */
	private tileRect(id: number): Rect | null {
		const doc = this.surface.documentSize
		const x = (id % this.cols) * TILE
		const y = Math.floor(id / this.cols) * TILE
		const w = Math.min(TILE, doc.width - x)
		const h = Math.min(TILE, doc.height - y)
		if (w <= 0 || h <= 0) return null

		return { x, y, w, h }
	}

	private readTile(id: number): ImageData | null {
		const rect = this.tileRect(id)
		return rect ? this.surface.readRegion(rect) : null
	}

	private writeTile(id: number, data: ImageData): void {
		const rect = this.tileRect(id)
		if (rect) this.surface.writeRegion(data, rect.x, rect.y)
	}
}
