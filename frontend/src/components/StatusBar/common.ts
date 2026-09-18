/**
 * estimated saved file size for the fourth status cell.
 * Placeholder; the real one is lazy and debounced over actual image data.
 */
export function estimateFileSize(width: number, height: number): string {
	const kb = Math.round((width * height * 3) / 1024)
	return kb >= 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`
}

export function formatZoomPercent(zoom: number): string {
	return `${Math.round(zoom * 100)}%`
}

/** slider position for a zoom factor; falls back to the first step when off-scale. */
export function zoomStepIndex(zoom: number, steps: readonly number[]): number {
	return Math.max(0, steps.indexOf(zoom))
}
