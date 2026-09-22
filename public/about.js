// the page opens in the language the editor is set to; the app writes that
// choice here, and a visitor who has never opened the editor reads english.
const STORAGE_KEY = "language"

function storedLanguage() {
	try {
		return localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

if (storedLanguage() === "vi") {
	const page = document.documentElement
	page.lang = "vi"
	document.title = page.dataset.titleVi
}
