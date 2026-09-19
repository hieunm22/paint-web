import type { Language, LanguageDef } from "./types"

/** localStorage key holding the chosen language. */
export const LANGUAGE_STORAGE_KEY = "language"

export const FALLBACK_LANGUAGE: Language = "en"

/** the order the language switcher lists them in. */
export const LANGUAGES: LanguageDef[] = [
	{ id: "en", labelKey: "filemenu.language.en" },
	{ id: "vi", labelKey: "filemenu.language.vi" },
]
