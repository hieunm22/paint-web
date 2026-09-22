import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/** folders under src/ that are importable as bare specifiers, e.g. "components/Icon". */
const ROOT_DIRS = [
	"components",
	"hooks",
	"engine",
	"locales",
	"store",
	"common",
	"assets",
]

/**
 * regex bounds keep the alias from matching a longer name such as "storey",
 * and the exact form is needed for a folder's own index file ("store").
 */
const rootAliases = ROOT_DIRS.flatMap((dir) => {
	const target = fileURLToPath(new URL(`./src/${dir}`, import.meta.url))
	return [
		{ find: new RegExp(`^${dir}$`), replacement: target },
		{ find: new RegExp(`^${dir}/`), replacement: `${target}/` },
	]
})

export default defineConfig({
	plugins: [react()],
	server: {
		host: "0.0.0.0",
		port: 3004
	},
	resolve: { alias: rootAliases },
	// node is the default: the engine tests exercise pixel maths, and a jsdom
	// that cannot back a canvas would only look like it covers more. a component
	// test asks for jsdom in its own docblock.
	test: {
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
	},
	css: {
		preprocessorOptions: {
			// opt into the modern Sass API; the legacy JS API is deprecated.
			scss: { api: "modern" },
		},
	},
})
