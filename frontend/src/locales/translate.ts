import i18next from "i18next"
import type { TranslateParams } from "types/locales.types"

/**
 * translation for code with no React to hand: the engine, history labels. it
 * leaves i18n.ts alone, keeping the bootstrap out of the engine's graph.
 */
export function translate(key: string, params?: TranslateParams): string {
	if (!i18next.isInitialized) return key

	return i18next.t(key, params ?? {})
}
