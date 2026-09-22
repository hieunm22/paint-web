#!/usr/bin/env node
// rewrites the precache block of dist/sw.js with the file names of this build.
// a hashed bundle cannot be listed by hand, and a worker holding the shell
// alone leaves the first offline visit on a blank page.
// run: yarn build

import { createHash } from "node:crypto"
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const DIST = resolve(REPO, "dist")
const WORKER = resolve(DIST, "sw.js")

/** the worker is fetched by the browser itself and never served from cache. */
const SKIP = "/sw.js"

const START = "/* precache:start */"
const END = "/* precache:end */"

function built(dir, found = []) {
	for (const entry of readdirSync(dir)) {
		if (entry.startsWith(".")) continue

		const path = join(dir, entry)
		const stats = statSync(path)
		if (stats.isDirectory()) built(path, found)
		else found.push(path)
	}
	return found
}

/** every built file as the url it is served at, the navigation entry first. */
function urls() {
	const paths = built(DIST).map(path => {
		const parts = relative(DIST, path).split(sep)
		return `/${parts.join("/")}`
	})
	const served = paths.filter(url => url !== SKIP).sort()
	return ["/", ...served]
}

/** a name of its own per build, which is what lets activate drop the last one. */
function cacheName(shell) {
	const list = shell.join("\n")
	const digest = createHash("sha1").update(list).digest("hex")
	return `paint-web-${digest.slice(0, 8)}`
}

function block(shell) {
	const rows = shell.map(url => `\t"${url}",`)
	return [
		START,
		`const CACHE = "${cacheName(shell)}"`,
		"",
		"/** every file a cold start needs, written by scripts/build-sw.mjs. */",
		`const SHELL = [\n${rows.join("\n")}\n]`,
		END,
	].join("\n")
}

const worker = readFileSync(WORKER, "utf8")
const start = worker.indexOf(START)
const end = worker.indexOf(END)
if (start < 0 || end < 0) {
	console.error("build-sw: no precache markers in dist/sw.js")
	process.exit(1)
}

const shell = urls()
const head = worker.slice(0, start)
const tail = worker.slice(end + END.length)
writeFileSync(WORKER, `${head}${block(shell)}${tail}`)
console.log(`build-sw: ${shell.length} files precached`)
