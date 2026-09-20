import { translate } from "locales/translate"

/**
 * tooltip that repeats a label with its shortcut, as "Paste (Ctrl+V)".
 * callers render inside React and already re-render when the language changes.
 */
export function tooltipWithShortcut(
	labelKey: string,
	shortcutKey: string,
): string {
	return translate("common.tooltip.with-shortcut", {
		0: translate(labelKey),
		1: translate(shortcutKey),
	})
}
