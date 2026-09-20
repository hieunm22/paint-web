import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import {
	FALLBACK_LANGUAGE,
	LANGUAGE_STORAGE_KEY,
	LANGUAGES,
} from "common/constant"
import en from "locales/en.json"
import vi from "locales/vi.json"
import type { Language } from "types/locales.types"

function isLanguage(value: unknown): value is Language {
	return LANGUAGES.some((lang) => lang.id === value)
}

/** a browser with site data blocked throws here rather than returning null. */
function storedLanguage(): Language {
	try {
		const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY)
		if (isLanguage(saved)) return saved
	} catch {
		/* fall through to the default */
	}

	return FALLBACK_LANGUAGE
}

void i18next.use(initReactI18next).init({
	resources: { en: { translation: en }, vi: { translation: vi } },
	lng: storedLanguage(),
	fallbackLng: FALLBACK_LANGUAGE,
	// the csv writes placeholders as {0}; i18next would otherwise expect {{0}}
	interpolation: { prefix: "{", suffix: "}", escapeValue: false },
})

document.documentElement.lang = i18next.language

export function currentLanguage(): Language {
	return isLanguage(i18next.language) ? i18next.language : FALLBACK_LANGUAGE
}

export function setLanguage(language: Language): void {
	void i18next.changeLanguage(language)
	document.documentElement.lang = language

	try {
		localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
	} catch {
		/* the choice simply does not survive a reload */
	}
}
