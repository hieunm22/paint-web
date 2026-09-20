import { useEffect } from "react"
import { useFileCommands } from "hooks/useFileCommands"
import type { DroppedItem } from "types/common.types"

/** Chrome alone resolves a dropped item to a handle, which makes Save overwrite. */
async function handleOf(
	item: DataTransferItem | undefined,
): Promise<FileSystemFileHandle | null> {
	const dropped = item as DroppedItem | undefined
	if (!dropped?.getAsFileSystemHandle) return null

	try {
		const handle = await dropped.getAsFileSystemHandle()
		return handle?.kind === "file" ? (handle as FileSystemFileHandle) : null
	} catch {
		return null
	}
}

/** dropping a picture anywhere on the window opens it. */
export function useFileDrop(): void {
	const commands = useFileCommands()

	useEffect(() => {
		const onDragOver = (e: DragEvent) => {
			if (!e.dataTransfer) return

			// without this the browser navigates away to the dropped file
			e.preventDefault()
			e.dataTransfer.dropEffect = "copy"
		}

		const onDrop = (e: DragEvent) => {
			const file = e.dataTransfer?.files?.[0]
			if (!file?.type.startsWith("image/")) return

			e.preventDefault()
			// the item is only readable while the event is being dispatched
			const pending = handleOf(e.dataTransfer?.items?.[0])
			void pending.then(handle => commands.openPicked({ file, handle }))
		}

		window.addEventListener("dragover", onDragOver)
		window.addEventListener("drop", onDrop)
		return () => {
			window.removeEventListener("dragover", onDragOver)
			window.removeEventListener("drop", onDrop)
		}
	}, [commands])
}
