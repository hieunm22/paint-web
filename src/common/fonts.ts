import type { LocalFontWindow } from "types/common.types"

/** wide and narrow letters together, where a substitution shows up clearly. */
const SAMPLE = "mmmwwwiiilllABCgq0123"

/** a large size spreads the difference out past rounding. */
const PROBE_SIZE = 72

/** two unlike stacks: a family matching one may still differ from the other. */
const FALLBACKS = ["monospace", "serif"]

let measurer: CanvasRenderingContext2D | null | undefined

/** one scratch context; a node test has no document and gets null. */
function context(): CanvasRenderingContext2D | null {
	if (measurer === undefined) {
		measurer =
			typeof document === "undefined"
				? null
				: document.createElement("canvas").getContext("2d")
	}

	return measurer
}

function widthOf(ctx: CanvasRenderingContext2D, stack: string): number {
	ctx.font = `${PROBE_SIZE}px ${stack}`
	return ctx.measureText(SAMPLE).width
}

/**
 * which of the listed families the machine really carries: a missing one is
 * substituted in silence, and only a sample's width gives that away.
 */
export function availableFonts(families: string[]): string[] {
	const ctx = context()
	if (!ctx) return families

	const base = FALLBACKS.map(stack => widthOf(ctx, stack))
	const found = families.filter(family =>
		FALLBACKS.some(
			(stack, i) => widthOf(ctx, `"${family}", ${stack}`) !== base[i],
		),
	)

	return found.length ? found : families
}

/** true where the browser is able to name the installed fonts at all. */
export function canListLocalFonts(): boolean {
	return typeof window !== "undefined" && "queryLocalFonts" in window
}

/** has the machine already been asked once, in this session or an earlier one? */
export async function localFontsAllowed(): Promise<boolean> {
	if (!canListLocalFonts() || !navigator.permissions) return false

	try {
		const status = await navigator.permissions.query({
			name: "local-fonts" as PermissionName,
		})
		return status.state === "granted"
	} catch {
		return false
	}
}

/**
 * every family installed on the machine, in name order. the first call puts a
 * permission prompt up; a refusal comes back empty and the fixed list stands.
 */
export async function localFontFamilies(): Promise<string[]> {
	if (!canListLocalFonts()) return []

	try {
		const fonts = await (window as unknown as LocalFontWindow).queryLocalFonts()
		const families = [...new Set(fonts.map(font => font.family))]
		return families.sort((a, b) => a.localeCompare(b))
	} catch {
		return []
	}
}
