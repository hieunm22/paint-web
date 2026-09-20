// hand written rather than generated: the app is one html file plus hashed
// assets, and a build plugin would only restate that.

const CACHE = "paint-web-v1"

/** the shell a cold start needs before any asset is asked for. */
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"]

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) => cache.addAll(SHELL)),
	)
	self.skipWaiting()
})

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((names) =>
				Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))),
			)
			.then(() => self.clients.claim()),
	)
})

/** hashed file names can never go stale, so the cache answers them first. */
function isHashed(url) {
	return url.pathname.startsWith("/assets/")
}

async function cacheFirst(request) {
	const hit = await caches.match(request)
	if (hit) return hit

	const response = await fetch(request)
	if (response.ok) {
		const cache = await caches.open(CACHE)
		await cache.put(request, response.clone())
	}
	return response
}

/**
 * the shell is asked for over the network every time: a user stuck on last
 * week's index.html would never see a deploy. the cache is the offline answer.
 */
async function networkFirst(request) {
	try {
		const response = await fetch(request)
		if (response.ok) {
			const cache = await caches.open(CACHE)
			await cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		const hit = await caches.match(request)
		if (hit) return hit
		throw error
	}
}

self.addEventListener("fetch", (event) => {
	const { request } = event
	const url = new URL(request.url)
	if (request.method !== "GET" || url.origin !== self.location.origin) return

	if (request.mode === "navigate") {
		event.respondWith(networkFirst(request))
		return
	}

	event.respondWith(isHashed(url) ? cacheFirst(request) : networkFirst(request))
})
