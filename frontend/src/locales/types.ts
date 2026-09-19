export type Language = "en" | "vi"

export interface LanguageDef {
	id: Language
	labelKey: string
}

/** values for the {0}, {1} placeholders inside a translated string. */
export type TranslateParams = Record<string, string | number>
