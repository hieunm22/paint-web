import { useEffect } from "react"
import { isTypingTarget } from "common/dom"
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

			const items = Array.from(e.clipboardData?.items ?? [])
			const image = items.find(
				(item) => item.kind === "file" && item.type.startsWith("image/"),
			)
			const file = image?.getAsFile()
			if (!file) return

			e.preventDefault()
			void commands.pasteBlob(file)
		}

		window.addEventListener("paste", onPaste)
		return () => window.removeEventListener("paste", onPaste)
	}, [commands])
}
