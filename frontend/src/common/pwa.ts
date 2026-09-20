/**
 * the worker precaches the shell and serves it offline. it is registered only
 * in a built app: in dev it would answer with yesterday's bundle.
 */
export function registerServiceWorker(): void {
	if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return

	window.addEventListener("load", () => {
		void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
	})
}
