#!/usr/bin/env node
// fails when a user-visible string is written in code instead of language.csv.
// run: yarn check:i18n

import { readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const SRC = join(ROOT, "src")

/** the public page, which repeats the About dialog and cannot import it. */
const INTRO_PAGE = join(ROOT, "public", "about.html")
const DISCLAIMER_KEY = "dialog.about.disclaimer"

/** props whose value reaches the user, wherever they appear. */
const TEXT_PROPS = new Set([
	"label",
	"title",
	"aria-label",
	"ariaLabel",
	"shortcut",
	"placeholder",
	"note",
])

// the two gaps skip U+00D7 and U+00F7, which are maths signs, not letters
const VIETNAMESE = /[À-ÖØ-öø-ỹ]/

/** an <area>.<group>.<element> key, the only shape the csv emits. */
const KEY_SHAPE = /^[a-z][a-z0-9-]*\.[a-z0-9-]+\.[a-z0-9-]+$/

/** a run of letters, which is what separates prose from a lone mark. */
const PROSE = /[A-Za-z]{2}/

/**
 * anything outside printable ascii, bar the degree sign. a symbol the interface
 * needs is an icon in the registry, not a character nobody can type.
 */
const NON_ASCII = /[^\t\n\r\x20-\x7e\u00b0]/u

/**
 * every exemption needs a reason. paths are relative to src/.
 */
const EXEMPT_FILES = [
	// generated from language.csv, and the translations themselves
	"locales/en.json",
	"locales/vi.json",
	// the translation layer names its own keys and storage
	"locales/i18n.ts",
	"locales/constant.ts",
]

const EXEMPT_RULES = []

function isExempt(file, prop) {
	return EXEMPT_RULES.some((rule) => rule.file === file && rule.prop === prop)
}

const TRANSLATIONS = JSON.parse(
	readFileSync(join(SRC, "locales", "en.json"), "utf8"),
)

/** the text behind a key, or undefined when the csv never defined it. */
function read(table, key) {
	let node = table
	for (const part of key.split(".")) {
		if (typeof node !== "object" || node === null) return undefined
		node = node[part]
	}
	return typeof node === "string" ? node : undefined
}

function lookup(key) {
	return read(TRANSLATIONS, key)
}

function sources(dir, found = []) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) {
			sources(path, found)
		} else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts")) {
			found.push(path)
		}
	}
	return found
}

function propName(node) {
	if (ts.isIdentifier(node) || ts.isStringLiteral(node)) return node.text
	return null
}

/** a string literal or a template with no substitutions. */
function literalText(node) {
	if (!node) return null
	if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
		return node.text
	}
	if (ts.isJsxExpression(node)) return literalText(node.expression)
	return null
}

function check(path) {
	const file = relative(SRC, path)
	if (EXEMPT_FILES.includes(file)) return []

	const text = readFileSync(path, "utf8")
	const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true)
	const problems = []

	const at = (node) =>
		source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1

	const report = (node, what, value) =>
		problems.push(`${file}:${at(node)}  ${what}: ${JSON.stringify(value)}`)

	const walk = (node) => {
		if (ts.isStringLiteral(node) && KEY_SHAPE.test(node.text)) {
			if (lookup(node.text) === undefined) {
				report(node, "unknown key", node.text)
			}
		}
		if (ts.isJsxText(node)) {
			const content = node.text.trim()
			if (PROSE.test(content)) report(node, "jsx text", content)
		} else if (ts.isJsxAttribute(node)) {
			const name = propName(node.name)
			const value = literalText(node.initializer)
			if (name && TEXT_PROPS.has(name) && value && PROSE.test(value)) {
				if (!isExempt(file, name)) report(node, `prop ${name}`, value)
			}
		} else if (ts.isPropertyAssignment(node)) {
			const name = propName(node.name)
			const value = literalText(node.initializer)
			if (name && TEXT_PROPS.has(name) && value && PROSE.test(value)) {
				if (!isExempt(file, name)) report(node, `field ${name}`, value)
			}
		}
		ts.forEachChild(node, walk)
	}
	walk(source)

	text.split("\n").forEach((line, i) => {
		if (VIETNAMESE.test(line)) {
			problems.push(`${file}:${i + 1}  vietnamese text`)
			return
		}

		const [found] = line.match(NON_ASCII) ?? []
		if (found) {
			const point = found.codePointAt(0).toString(16).toUpperCase()
			problems.push(
				`${file}:${i + 1}  non-ascii ${JSON.stringify(found)} (U+${point.padStart(4, "0")})`,
			)
		}
	})

	return problems
}

/**
 * the intro page is plain html served beside the app: it cannot reach i18next,
 * and a disclaimer that drifts from the one in About is the risk being managed.
 */
function checkIntroPage() {
	const page = collapse(readFileSync(INTRO_PAGE, "utf8"))
	const missing = []

	for (const locale of ["en", "vi"]) {
		const path = join(SRC, "locales", `${locale}.json`)
		const table = JSON.parse(readFileSync(path, "utf8"))
		const wanted = collapse(read(table, DISCLAIMER_KEY) ?? "")
		if (!wanted || !page.includes(wanted)) {
			missing.push(`public/about.html  missing the ${locale} ${DISCLAIMER_KEY}`)
		}
	}

	return missing
}

/** html wraps where the json does not; only the words are being compared. */
function collapse(text) {
	return text.replace(/\s+/g, " ")
}

const problems = [...sources(SRC).flatMap(check), ...checkIntroPage()]

if (problems.length > 0) {
	console.error(`${problems.length} problem(s):\n`)
	for (const problem of problems) console.error(`  ${problem}`)
	console.error(
		"\ntext belongs in tools/language.csv; a symbol belongs in the icon registry.",
	)
	process.exit(1)
}

console.log("check:i18n  no hard-coded strings, no untypeable characters")
