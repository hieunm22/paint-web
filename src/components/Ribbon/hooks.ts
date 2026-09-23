import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	type KeyboardEvent,
	type RefObject,
} from "react"
import {
	ARROW_STEPS,
	FONT_FAMILIES,
	SHAPE_GALLERY_COLS,
	SHAPE_GALLERY_VISIBLE_ROWS,
} from "./constant"
import {
	availableFonts,
	localFontFamilies,
	localFontsAllowed,
} from "common/fonts"
import { maxGalleryRow } from "./common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setTextOptions } from "store/slices/toolSlice"
import type { TextOptions } from "types/store.types"
import type {
	FontFamilyList,
	FontStyleId,
	GalleryBox,
	RovingFocus,
	TextRibbonState,
} from "./types"

/**
 * the ribbon is one toolbar: the arrows walk it and a single button sits in
 * the tab order, so Tab steps past the whole strip instead of through sixty.
 */
export function useRovingFocus(): RovingFocus {
	const ref = useRef<HTMLDivElement>(null)
	const current = useRef(0)

	const buttons = useCallback(() => {
		const found = ref.current?.querySelectorAll<HTMLButtonElement>(
			"button:not(:disabled)",
		)
		return [...(found ?? [])]
	}, [])

	// the strip is rebuilt on every tool change, and the one reachable button
	// has to be marked again each time
	useEffect(() => {
		const items = buttons()
		const at = Math.min(current.current, items.length - 1)
		items.forEach((item, i) => {
			item.tabIndex = i === at ? 0 : -1
		})
	})

	return {
		ref,

		onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
			const step = ARROW_STEPS[e.key]
			const items = buttons()
			if (!step || !items.length) return

			e.preventDefault()
			const from = items.indexOf(document.activeElement as HTMLButtonElement)
			const next = (from + step + items.length) % items.length
			current.current = next
			items[next]?.focus()
		},

		// focusin has already moved the focus, which is what names the button
		onFocus: () => {
			const found = buttons().indexOf(
				document.activeElement as HTMLButtonElement,
			)
			if (found >= 0) current.current = found
		},
	}
}

/** scrolls the shape gallery one row at a time. */
export function useShapeGalleryScroll(totalShapes: number) {
	const [row, setRow] = useState(0)
	const maxRow = maxGalleryRow(
		totalShapes,
		SHAPE_GALLERY_COLS,
		SHAPE_GALLERY_VISIBLE_ROWS,
	)

	return {
		row,
		maxRow,
		canScrollUp: row > 0,
		canScrollDown: row < maxRow,
		scrollUp: () => setRow(r => Math.max(0, r - 1)),
		scrollDown: () => setRow(r => Math.min(maxRow, r + 1)),
	}
}

/**
 * expand and collapse the gallery box.
 */
export function useGalleryBox(
	stripRef: RefObject<HTMLElement>,
	open: boolean,
): GalleryBox | null {
	const [box, setBox] = useState<GalleryBox | null>(null)

	useLayoutEffect(() => {
		const strip = stripRef.current
		if (!open || !strip) {
			setBox(null)
			return
		}

		const place = () => {
			const rect = strip.getBoundingClientRect()
			setBox({ top: rect.top, left: rect.left, width: rect.width })
		}

		place()
		window.addEventListener("resize", place)
		// capture phase lets it follow any scrolling ancestor, not just the window
		window.addEventListener("scroll", place, true)

		return () => {
			window.removeEventListener("resize", place)
			window.removeEventListener("scroll", place, true)
		}
	}, [open, stripRef])

	return box
}

/** what the machine answered, kept for the life of the page. */
let installed: string[] = []
let asked = false

/**
 * get all fonts installed on the system.
 */
export function useFontFamilies(current: string): FontFamilyList {
	const [local, setLocal] = useState(installed)

	const load = useCallback(() => {
		if (asked) return

		asked = true
		void localFontFamilies().then(found => {
			installed = found
			setLocal(found)
		})
	}, [])

	// a grant from an earlier session needs no prompt and no gesture
	useEffect(() => {
		void localFontsAllowed().then(allowed => {
			if (allowed) load()
		})
	}, [load])

	const families = useMemo(() => {
		const found = local.length ? local : availableFonts(FONT_FAMILIES)
		return found.includes(current) ? found : [current, ...found]
	}, [current, local])

	return { families, load }
}

/**
 * the Font and Background groups over one slice of state. a live text box
 * reads the same options, which is what makes a change show as you make it.
 */
export function useTextRibbon(): TextRibbonState {
	const dispatch = useAppDispatch()
	const options = useAppSelector(s => s.tool.text)

	return {
		options,
		setFamily: fontFamily => dispatch(setTextOptions({ fontFamily })),
		setSize: fontSize => dispatch(setTextOptions({ fontSize })),
		toggleStyle: (id: FontStyleId) =>
			dispatch(setTextOptions({ [id]: !options[id] })),
		setBackground: (background: TextOptions["background"]) =>
			dispatch(setTextOptions({ background })),
	}
}
