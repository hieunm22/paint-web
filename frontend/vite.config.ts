import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

/** folders under src/ that are importable as bare specifiers, e.g. "components/Icon". */
const ROOT_DIRS = ["components", "hooks", "engine", "store", "common", "assets"]

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
	css: {
		preprocessorOptions: {
			// opt into the modern Sass API; the legacy JS API is deprecated.
			scss: { api: "modern" },
		},
	},
})
