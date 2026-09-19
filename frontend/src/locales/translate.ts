import i18next from "i18next"
import type { TranslateParams } from "./types"

/**
 * translation helper for code that has no React to hand: the engine, history
 * labels, live-region announcements. it deliberately does not import i18n.ts,
 * which keeps the app's bootstrap out of the engine's module graph.
 */
export function translate(key: string, params?: TranslateParams): string {
	if (!i18next.isInitialized) return key

	return i18next.t(key, params ?? {})
}
