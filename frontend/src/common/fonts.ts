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
 * which of the listed families the machine really carries. the browser will
 * not enumerate them and substitutes a missing one in silence, which leaves
 * the width of a sample string as the only way to tell. an empty result means
 * the probe itself failed, and the whole list goes back rather than none of it.
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
