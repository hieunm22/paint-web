import type { MenuPosition, Viewport } from "./types"

/** gap kept between the menu and the viewport edge. */
const EDGE_GAP = 4

/**
 * places a menu under its anchor, flipping or shifting it to stay on screen.
 * pure, which makes the flip logic unit testable without a DOM.
 */
export function placeMenu(
	anchor: { top: number; bottom: number; left: number },
	menu: { width: number; height: number },
	viewport: Viewport,
): MenuPosition {
	let left = anchor.left
	let top = anchor.bottom

	if (left + menu.width > viewport.width - EDGE_GAP) {
		left = Math.max(EDGE_GAP, viewport.width - menu.width - EDGE_GAP)
	}

	// no room below: flip above the anchor
	if (top + menu.height > viewport.height - EDGE_GAP) {
		top = Math.max(EDGE_GAP, anchor.top - menu.height)
	}

	return { top, left }
}

/**
 * a plain item, one of a set that drops the others, or a switch that stands
 * on its own. the mark drawn beside it is the same; what it means is not.
 */
export function menuItemRole(checked?: boolean, radio?: boolean): string {
	if (checked === undefined) return "menuitem"

	return radio ? "menuitemradio" : "menuitemcheckbox"
}
