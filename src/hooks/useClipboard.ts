import { useEffect } from "react"
import { isTypingTarget } from "common/dom"
import { isImageFile } from "common/format"
import { useFileCommands } from "hooks/useFileCommands"

/**
 * the paste keystroke, which is the only route Firefox leaves open: reading the
 * clipboard from a button is blocked there.
 */
export function useClipboard(): void {
	const commands = useFileCommands()

	useEffect(() => {
		const onPaste = (e: ClipboardEvent) => {
			if (isTypingTarget(e.target)) return

			const files = Array.from(e.clipboardData?.files ?? [])
			const file = files.find(isImageFile)
			if (!file) return

			e.preventDefault()
			void commands.pasteBlob(file)
		}

		window.addEventListener("paste", onPaste)
		return () => window.removeEventListener("paste", onPaste)
	}, [commands])
}
