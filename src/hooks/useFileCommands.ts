import { useMemo } from "react"
import { CAN_SAVE_IN_PLACE, MAX_DIMENSION, MIME_TYPES } from "common/constant"
import {
	activeHandle,
	deferOpen,
	setActiveHandle,
	takeDeferredOpen,
} from "common/fileSession"
import {
	downloadBlob,
	ensurePermission,
	pickImageFile,
	pickSaveTarget,
	writeFile,
} from "common/fileSystem"
import { formatOfMime, stemOf, withExtension } from "common/format"
import { printImage } from "common/print"
import { rememberRecent } from "common/recents"
import { readSettings } from "common/settings"
import { documentName } from "store/common"
import { fitsCanvas } from "engine/canvasLimit"
import {
	decodeImage,
	encodeImage,
	imageObjectUrl,
	isAnimatedGif,
	thumbnailDataUrl,
} from "engine/codec"
import { paint } from "engine/PaintEngine"
import { useAppDispatch, useAppStore } from "store/hooks"
import { translate } from "locales/translate"
import {
	documentOpened,
	documentSaved,
	resetDocument,
} from "store/slices/docSlice"
import {
	closeBackstage,
	closeDialog,
	confirmDiscard,
	showToast,
} from "store/slices/uiSlice"
import type { PickedFile, RecentEntry } from "types/common.types"
import type { FileCommands, SaveOptions } from "types/hooks.types"
import type { ImageFormat } from "types/store.types"

const THUMBNAIL = 64

/** how long a tab that refuses to close gets before the notice goes up. */
const CLOSE_GRACE = 300

/**
 * the File menu, the Quick Access Toolbar, the discard dialog and the drop and
 * paste listeners all drive the same commands from here.
 */
export function useFileCommands(): FileCommands {
	const dispatch = useAppDispatch()
	const store = useAppStore()

	return useMemo(() => {
		const toast = (key: string) => void dispatch(showToast(key))

		/** recents only holds rows it can reopen, which needs a handle. */
		const remember = (
			name: string,
			format: ImageFormat,
			handle: FileSystemFileHandle | null,
			source: ImageData | ImageBitmap,
		) => {
			if (!handle) return

			void rememberRecent({
				name,
				format,
				openedAt: Date.now(),
				thumbnail: thumbnailDataUrl(source, THUMBNAIL),
				handle,
			})
		}

		/** one read of the whole bitmap, reused by the encoder and the thumbnail. */
		const snapshot = () => {
			const image = paint.readDocument()
			if (!image) throw new Error("no document")

			return image
		}

		const applyNew = () => {
			const size = readSettings().pageSize
			paint.newDocument(size)
			setActiveHandle(null)
			dispatch(resetDocument(size))
			dispatch(closeBackstage())
		}

		const applyOpen = async ({ file, handle }: PickedFile) => {
			try {
				if (await isAnimatedGif(file)) toast("toast.file.gif-flattened")

				const bitmap = await decodeImage(file)
				const { width, height } = bitmap
				if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
					bitmap.close()
					toast("toast.file.too-large")
					return
				}
				// under the app's own limit and still past what this browser
				// can back: an 8k picture is 33 megapixels and iOS stops at 17
				if (!fitsCanvas({ width, height })) {
					bitmap.close()
					toast("toast.file.over-canvas-limit")
					return
				}

				paint.loadImage(bitmap)
				const format = formatOfMime(file.type)
				setActiveHandle(handle)
				dispatch(
					documentOpened({
						width,
						height,
						fileName: file.name,
						format,
						savedAt: file.lastModified || null,
					}),
				)
				dispatch(closeBackstage())
				remember(file.name, format, handle, bitmap)
				bitmap.close()
			} catch {
				toast("toast.file.open-failed")
			}
		}

		/** everything that replaces the document passes the unsaved-work gate. */
		const openPicked = async (picked: PickedFile) => {
			if (!store.getState().doc.isDirty) {
				await applyOpen(picked)
				return
			}

			deferOpen(picked)
			dispatch(confirmDiscard("load"))
		}

		const saveAs = async (format: ImageFormat, options: SaveOptions = {}) => {
			const { fileName } = store.getState().doc
			const stem =
				stemOf(options.fileName || fileName) ||
				translate("document.name.untitled")
			const name = withExtension(stem, format)

			try {
				// the picker needs the click that opened it; encoding first can
				// outlast that activation on a large picture
				const handle = await pickSaveTarget(name, format)
				// a browser with a picker and no handle means the user dismissed it
				if (!handle && CAN_SAVE_IN_PLACE) return false

				const image = snapshot()
				const blob = await encodeImage(image, format, options.quality)

				if (handle) {
					await writeFile(handle, blob)
					setActiveHandle(handle)
					dispatch(documentSaved({ fileName: handle.name, format }))
					remember(handle.name, format, handle, image)
					return true
				}

				downloadBlob(blob, name)
				setActiveHandle(null)
				dispatch(documentSaved({ fileName: name, format }))
				toast("toast.file.downloaded")
				return true
			} catch {
				toast("toast.file.save-failed")
				return false
			}
		}

		const save = async () => {
			const { format, fileName } = store.getState().doc
			const handle = activeHandle()
			if (!handle) return saveAs(format)

			try {
				if (!(await ensurePermission(handle, "readwrite"))) {
					toast("toast.file.permission-denied")
					return false
				}

				await writeFile(handle, await encodeImage(snapshot(), format))
				dispatch(documentSaved({ fileName, format }))
				return true
			} catch {
				toast("toast.file.save-failed")
				return false
			}
		}

		/** one png on the clipboard, which is the only format Paint writes. */
		const writeClipboard = async (image: ImageData) => {
			try {
				const item = new ClipboardItem({
					// Safari wants the promise, not the blob: awaiting first
					// spends the gesture the write needs
					[MIME_TYPES.png]: encodeImage(image, "png"),
				})
				await navigator.clipboard.write([item])
			} catch {
				toast("toast.clipboard.copy-failed")
			}
		}

		const pasteBlob = async (blob: Blob) => {
			try {
				const bitmap = await decodeImage(blob)
				paint.pasteBitmap(bitmap)
				bitmap.close()
			} catch {
				toast("toast.clipboard.no-image")
			}
		}

		const closeWindow = () => {
			window.close()
			// a tab the script did not open stays put, and nothing can close it
			window.setTimeout(() => toast("toast.file.close-blocked"), CLOSE_GRACE)
		}

		return {
			newDocument: () => {
				if (store.getState().doc.isDirty) dispatch(confirmDiscard("new"))
				else applyNew()
			},

			openDocument: async () => {
				const picked = await pickImageFile()
				if (picked) await openPicked(picked)
			},

			openPicked,

			openRecent: async (entry: RecentEntry) => {
				const handle = entry.handle
				if (!handle) return

				if (!(await ensurePermission(handle, "read"))) {
					toast("toast.file.permission-denied")
					return
				}
				try {
					await openPicked({ file: await handle.getFile(), handle })
				} catch {
					toast("toast.file.open-failed")
				}
			},

			save,
			saveAs,

			copyImage: () => writeClipboard(snapshot()),

			print: async () => {
				const { width, height, fileName } = store.getState().doc
				const setup = store.getState().print
				const title = documentName(fileName)
				let src = ""

				try {
					const image = snapshot()
					src = await imageObjectUrl(image)
					await printImage(src, { width, height }, setup, title)
				} catch {
					toast("toast.print.failed")
				} finally {
					if (src) URL.revokeObjectURL(src)
				}
			},

			openCapture: (blob: Blob) => {
				const stem = translate("document.name.camera")
				const name = withExtension(stem, "png")
				const file = new File([blob], name, { type: MIME_TYPES.png })

				return openPicked({ file, handle: null })
			},

			copySelection: () => {
				const image = paint.readSelection() ?? snapshot()
				return writeClipboard(image)
			},

			cutSelection: async () => {
				const image = paint.readSelection()
				if (!image) return

				await writeClipboard(image)
				paint.deleteSelection()
			},

			pasteImage: async () => {
				if (!navigator.clipboard?.read) {
					toast("toast.clipboard.paste-shortcut")
					return
				}
				try {
					for (const item of await navigator.clipboard.read()) {
						const type = item.types.find(one => one.startsWith("image/"))
						if (!type) continue

						await pasteBlob(await item.getType(type))
						return
					}
					toast("toast.clipboard.no-image")
				} catch {
					toast("toast.clipboard.paste-shortcut")
				}
			},

			pasteBlob,

			pasteFrom: async () => {
				const picked = await pickImageFile()
				if (picked) await pasteBlob(picked.file)
			},

			exit: () => {
				if (store.getState().doc.isDirty) dispatch(confirmDiscard("exit"))
				else closeWindow()
			},

			resume: () => {
				const { pending } = store.getState().ui
				dispatch(closeDialog())

				if (pending === "new") applyNew()
				else if (pending === "exit") closeWindow()
				else if (pending === "load") {
					const picked = takeDeferredOpen()
					if (picked) void applyOpen(picked)
				}
			},

			cancelPending: () => {
				takeDeferredOpen()
				dispatch(closeDialog())
			},
		}
	}, [dispatch, store])
}
