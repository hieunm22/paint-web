import { useEffect, useRef } from "react"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch } from "store/hooks"
import { endFileDrag, showToast, startFileDrag } from "store/slices/uiSlice"
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

/** text dragged inside the app is not a file and must not raise the overlay. */
function carriesFile(event: DragEvent): boolean {
	return Boolean(event.dataTransfer?.types.includes("Files"))
}

/** dropping a picture anywhere on the window opens it. */
export function useFileDrop(): void {
	const commands = useFileCommands()
	const dispatch = useAppDispatch()
	// dragenter fires again for every element crossed, so the entries are counted
	const depth = useRef(0)

	useEffect(() => {
		const settle = () => {
			depth.current = 0
			dispatch(endFileDrag())
		}

		const onDragEnter = (e: DragEvent) => {
			if (!carriesFile(e)) return

			depth.current += 1
			if (depth.current === 1) dispatch(startFileDrag())
		}

		const onDragLeave = (e: DragEvent) => {
			if (!carriesFile(e)) return

			depth.current -= 1
			if (depth.current <= 0) settle()
		}

		const onDragOver = (e: DragEvent) => {
			if (!e.dataTransfer) return

			// without this the browser navigates away to the dropped file
			e.preventDefault()
			e.dataTransfer.dropEffect = "copy"
		}

		const onDrop = (e: DragEvent) => {
			if (!carriesFile(e)) return

			// the drop is ours whatever the file turns out to be, or the tab
			// navigates to it and the picture is gone
			e.preventDefault()
			settle()

			const files = e.dataTransfer?.files
			const file = files?.[0]
			if (!file) return
			if (!file.type.startsWith("image/")) {
				dispatch(showToast("toast.file.not-a-picture"))
				return
			}

			// the rest of the drop goes nowhere, and saying so beats silence
			if (files.length > 1) dispatch(showToast("toast.file.one-at-a-time"))

			// the item is only readable while the event is being dispatched
			const pending = handleOf(e.dataTransfer?.items?.[0])
			void pending.then(handle => commands.openPicked({ file, handle }))
		}

		window.addEventListener("dragenter", onDragEnter)
		window.addEventListener("dragleave", onDragLeave)
		window.addEventListener("dragover", onDragOver)
		window.addEventListener("drop", onDrop)
		return () => {
			window.removeEventListener("dragenter", onDragEnter)
			window.removeEventListener("dragleave", onDragLeave)
			window.removeEventListener("dragover", onDragOver)
			window.removeEventListener("drop", onDrop)
		}
	}, [commands, dispatch])
}
