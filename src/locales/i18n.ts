import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import { FALLBACK_LANGUAGE } from "common/constant"
import { parseLanguage, readSettings, writeSettings } from "common/settings"
import en from "locales/en.json"
import vi from "locales/vi.json"
import type { Language } from "types/locales.types"

void i18next.use(initReactI18next).init({
	resources: { en: { translation: en }, vi: { translation: vi } },
	lng: readSettings().language,
	fallbackLng: FALLBACK_LANGUAGE,
	// the csv writes placeholders as {0}; i18next would otherwise expect {{0}}
	interpolation: { prefix: "{", suffix: "}", escapeValue: false },
})

document.documentElement.lang = i18next.language

export function currentLanguage(): Language {
	return parseLanguage(i18next.language)
}

export function setLanguage(language: Language): void {
	void i18next.changeLanguage(language)
	document.documentElement.lang = language
	writeSettings({ language })
}
