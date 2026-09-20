import type { RecentEntry } from "types/common.types"

const DB_NAME = "paint-web"
const DB_VERSION = 1
const STORE = "recents"

/** how many rows the backstage column has space for. */
const LIMIT = 6

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION)
		request.onupgradeneeded = () => {
			const db = request.result
			if (!db.objectStoreNames.contains(STORE)) {
				db.createObjectStore(STORE, { keyPath: "name" })
			}
		}
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

function finished(tx: IDBTransaction): Promise<void> {
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve()
		tx.onerror = () => reject(tx.error)
		tx.onabort = () => reject(tx.error)
	})
}

function request<T>(source: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		source.onsuccess = () => resolve(source.result)
		source.onerror = () => reject(source.error)
	})
}

/**
 * newest first. a browser with site data blocked throws on open, and an empty
 * list is the right answer there rather than a broken backstage.
 */
export async function listRecents(): Promise<RecentEntry[]> {
	try {
		const db = await openDatabase()
		const rows = await request(
			db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
		)
		db.close()
		return (rows as RecentEntry[])
			.sort((a, b) => b.openedAt - a.openedAt)
			.slice(0, LIMIT)
	} catch {
		return []
	}
}

/** drops one row from the list. the file on disk is not touched. */
export async function forgetRecent(name: string): Promise<void> {
	try {
		const db = await openDatabase()
		const tx = db.transaction(STORE, "readwrite")
		tx.objectStore(STORE).delete(name)
		await finished(tx)
		db.close()
	} catch {
		/* the row stays, and it reappears in the list on the next open */
	}
}

/** records one file and drops whatever fell off the end of the list. */
export async function rememberRecent(entry: RecentEntry): Promise<void> {
	try {
		const db = await openDatabase()
		const tx = db.transaction(STORE, "readwrite")
		const store = tx.objectStore(STORE)
		store.put(entry)

		const rows = ((await request(store.getAll())) as RecentEntry[]).sort(
			(a, b) => b.openedAt - a.openedAt,
		)
		for (const stale of rows.slice(LIMIT)) store.delete(stale.name)

		await finished(tx)
		db.close()
	} catch {
		/* the list simply does not grow */
	}
}
