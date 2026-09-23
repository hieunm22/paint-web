// one key holds every setting the editor keeps, language among them.
const STORAGE_KEY = "paint-web"

function storedLanguage() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)).language
	} catch {
		return null
	}
}

if (storedLanguage() === "vi") {
	const page = document.documentElement
	page.lang = "vi"
	document.title = page.dataset.titleVi
}
