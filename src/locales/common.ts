import { formatShortcut } from "common/platform"
import { translate } from "locales/translate"

/**
 * tooltip with its shortcut, as "Paste (Ctrl+V)" to show in the UI.
 */
export function tooltipWithShortcut(
	labelKey: string,
	shortcutKey?: string,
): string {
	if (!shortcutKey) return translate(labelKey)

	return translate("common.tooltip.with-shortcut", {
		0: translate(labelKey),
		1: shortcutText(shortcutKey),
	})
}

/** the keys behind a command, printed for the platform running the app. */
export function shortcutText(shortcutKey: string): string {
	return formatShortcut(translate(shortcutKey))
}
