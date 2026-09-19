#!/usr/bin/env node
// breaks an import, export or destructuring pattern of more than three members
// onto one line each. prettier decides by column count alone and joins these
// back together, which is why this runs after it rather than as a plugin.
// run: yarn format   (or yarn check:format to only report)

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "src")

/** up to three members stay on one line; prettier still wraps an over-long one. */
const INLINE_LIMIT = 3

const checkOnly = process.argv.includes("--check")

function sources(dir, found = []) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) sources(path, found)
		else if (/\.tsx?$/.test(entry)) found.push(path)
	}
	return found
}

/** the three brace lists the rule covers; an object literal is not one of them. */
function braceList(node) {
	if (ts.isNamedImports(node)) return node.elements
	if (ts.isNamedExports(node)) return node.elements
	if (ts.isObjectBindingPattern(node)) return node.elements
	return null
}

/** leading whitespace of the line the list opens on. */
function indentAt(text, position) {
	const lineStart = text.lastIndexOf("\n", position - 1) + 1
	const [indent] = text.slice(lineStart, position).match(/^[\t ]*/)
	return indent
}

function collect(text, source) {
	const edits = []

	const visit = (node) => {
		const elements = braceList(node)
		if (elements && elements.length > INLINE_LIMIT) {
			const start = node.getStart(source)
			const end = node.getEnd()
			if (!text.slice(start, end).includes("\n")) {
				const indent = indentAt(text, start)
				const lines = elements.map((el) => `${indent}\t${el.getText(source)},`)
				edits.push({
					start,
					end,
					replacement: `{\n${lines.join("\n")}\n${indent}}`,
				})
			}
		}
		ts.forEachChild(node, visit)
	}
	visit(source)

	return edits
}

let changed = 0
const offenders = []

for (const path of sources(SRC)) {
	const text = readFileSync(path, "utf8")
	const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
	const edits = collect(text, source)
	if (!edits.length) continue

	changed++
	const file = relative(SRC, path)
	for (const edit of edits) {
		const line = source.getLineAndCharacterOfPosition(edit.start).line + 1
		offenders.push(`${file}:${line}`)
	}
	if (checkOnly) continue

	// last edit first: an earlier rewrite would move every later position
	let out = text
	for (const edit of edits.reverse()) {
		out = out.slice(0, edit.start) + edit.replacement + out.slice(edit.end)
	}
	writeFileSync(path, out)
}

if (checkOnly && offenders.length) {
	console.error(`${offenders.length} list(s) of more than ${INLINE_LIMIT} members on one line:\n`)
	for (const offender of offenders) console.error(`  ${offender}`)
	console.error("\nrun yarn format.")
	process.exit(1)
}

console.log(
	checkOnly
		? "check:format  every list of more than three members is wrapped"
		: `wrap-members  ${changed} file(s) rewrapped`,
)
