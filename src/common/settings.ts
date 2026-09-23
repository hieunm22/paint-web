import {
	DEFAULT_DOCUMENT,
	FALLBACK_LANGUAGE,
	LANGUAGES,
	MAX_DIMENSION,
	QAT_DEFAULT,
	QAT_ORDER,
	SETTINGS_DEFAULT,
	SETTINGS_STORAGE_KEY,
	VIEW_TOGGLES_DEFAULT,
} from "common/constant"
import type { Size } from "types/engine.types"
import type { Language } from "types/locales.types"
import type { QatItemId, Settings, ViewToggles } from "types/store.types"

/**
 * every setting the app keeps, read as one value
 */
export function readSettings(): Settings {
	try {
		return parseSettings(
			JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null"),
		)
	} catch {
		return SETTINGS_DEFAULT
	}
}

/**
 * one field at a time. the rest is read back and written out as it stands,
 * which keeps two settings saved a moment apart from dropping each other.
 */
export function writeSettings(change: Partial<Settings>): void {
	try {
		localStorage.setItem(
			SETTINGS_STORAGE_KEY,
			JSON.stringify({ ...readSettings(), ...change }),
		)
	} catch {
		// storage blocked: the settings last only as long as this visit
	}
}

/** each field stands on its own: one unreadable value loses only itself. */
export function parseSettings(saved: unknown): Settings {
	const stored = saved as Partial<Settings> | null

	return {
		language: parseLanguage(stored?.language),
		qat: parseQat(stored?.qat),
		pageSize: parsePageSize(stored?.pageSize),
		thumbnailWidth: parseThumbnailWidth(stored?.thumbnailWidth),
		view: parseViewToggles(stored?.view),
	}
}

export function parseLanguage(saved: unknown): Language {
	return LANGUAGES.some(lang => lang.id === saved)
		? (saved as Language)
		: FALLBACK_LANGUAGE
}

export function parseQat(saved: unknown): QatItemId[] {
	if (!Array.isArray(saved)) return QAT_DEFAULT

	return QAT_ORDER.filter(id => saved.includes(id))
}

/** a stored size is taken whole: one unusable side and the default wins. */
export function parsePageSize(saved: unknown): Size {
	const size = saved as Partial<Size> | null
	const width = usableSide(size?.width)
	const height = usableSide(size?.height)

	return width && height ? { width, height } : DEFAULT_DOCUMENT
}

export function parseThumbnailWidth(saved: unknown): number | null {
	return typeof saved === "number" && saved > 0 ? saved : null
}

export function parseViewToggles(saved: unknown): ViewToggles {
	const stored = saved as Partial<ViewToggles> | null

	return {
		showRuler: boolOr(stored?.showRuler, VIEW_TOGGLES_DEFAULT.showRuler),
		showGrid: boolOr(stored?.showGrid, VIEW_TOGGLES_DEFAULT.showGrid),
		showStatusBar: boolOr(
			stored?.showStatusBar,
			VIEW_TOGGLES_DEFAULT.showStatusBar,
		),
	}
}

function boolOr(value: unknown, fallback: boolean): boolean {
	return typeof value === "boolean" ? value : fallback
}

/** zero stands for unusable, which is a side the document can never have. */
function usableSide(value: unknown): number {
	if (typeof value !== "number" || !Number.isInteger(value)) return 0

	return value >= 1 && value <= MAX_DIMENSION ? value : 0
}
