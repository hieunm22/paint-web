import { translate } from "locales/translate"

/** the measured size of the encoded picture, for the fourth status cell. */
export function formatFileSize(bytes: number): string {
	const kb = Math.round(bytes / 1024)

	return kb >= 1024
		? translate("statusbar.cell.file-size-mb", { 0: (kb / 1024).toFixed(1) })
		: translate("statusbar.cell.file-size-kb", { 0: kb })
}

export function formatZoomPercent(zoom: number): string {
	return translate("statusbar.zoom.percent", { 0: Math.round(zoom * 100) })
}

/** slider position for a zoom factor; falls back to the first step when off-scale. */
export function zoomStepIndex(zoom: number, steps: readonly number[]): number {
	return Math.max(0, steps.indexOf(zoom))
}
