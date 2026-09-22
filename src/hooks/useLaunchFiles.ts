import { useEffect } from "react"
import { useFileCommands } from "hooks/useFileCommands"
import type { LaunchWindow } from "types/common.types"

/**
 * "Open with Paint" on an installed app: the file arrives as a handle through
 * the launch queue rather than through a picker, and opens like any other.
 */
export function useLaunchFiles() {
	const files = useFileCommands()

	useEffect(() => {
		const queue = (window as unknown as LaunchWindow).launchQueue
		if (!queue) return

		queue.setConsumer(params => {
			const handle = params.files[0]
			if (!handle) return

			void handle
				.getFile()
				.then(file => files.openPicked({ file, handle }))
				.catch(() => undefined)
		})
	}, [files])
}
