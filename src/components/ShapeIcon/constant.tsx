import type { ShapeKind } from "types/store.types"

/**
 * the 23 gallery shapes, drawn in a 0 0 24 24 viewBox.
 * Deliberately not Font Awesome: these are real geometry the user draws.
 */
export const SHAPE_PATHS: Record<ShapeKind, JSX.Element> = {
	line: <path d="M4 20 L20 4" />,
	curve: <path d="M4 18 C8 4, 16 4, 20 18" />,
	oval: <ellipse cx="12" cy="12" rx="9" ry="6.5" />,
	rect: <rect x="3" y="6" width="18" height="12" />,
	"rounded-rect": <rect x="3" y="6" width="18" height="12" rx="3.5" />,
	polygon: <path d="M4 14 L9 5 L17 7 L20 15 L12 20 Z" />,
	"right-triangle": <path d="M5 4 L5 20 L20 20 Z" />,
	triangle: <path d="M12 4 L21 20 L3 20 Z" />,
	diamond: <path d="M12 3 L21 12 L12 21 L3 12 Z" />,
	pentagon: <path d="M12 3 L21 10 L17.5 20.5 L6.5 20.5 L3 10 Z" />,
	hexagon: <path d="M8 4 L16 4 L21 12 L16 20 L8 20 L3 12 Z" />,
	"arrow-right": <path d="M3 9 L13 9 L13 4 L21 12 L13 20 L13 15 L3 15 Z" />,
	"arrow-left": <path d="M21 9 L11 9 L11 4 L3 12 L11 20 L11 15 L21 15 Z" />,
	"arrow-up": <path d="M9 21 L9 11 L4 11 L12 3 L20 11 L15 11 L15 21 Z" />,
	"arrow-down": <path d="M9 3 L9 13 L4 13 L12 21 L20 13 L15 13 L15 3 Z" />,
	"star-4": (
		<path d="M12 2 L14.4 9.6 L22 12 L14.4 14.4 L12 22 L9.6 14.4 L2 12 L9.6 9.6 Z" />
	),
	"star-5": (
		<path d="M12 2.5 L14.9 9.4 L22.3 10 L16.7 14.9 L18.4 22.1 L12 18.2 L5.6 22.1 L7.3 14.9 L1.7 10 L9.1 9.4 Z" />
	),
	"star-6": (
		<path d="M12 2 L15 7.5 L21.5 7.5 L18.2 12 L21.5 16.5 L15 16.5 L12 22 L9 16.5 L2.5 16.5 L5.8 12 L2.5 7.5 L9 7.5 Z" />
	),
	"callout-rounded": (
		<path d="M3 4 h18 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-9 l-5 5 v-5 h-4 a2 2 0 0 1 -2 -2 v-8 a2 2 0 0 1 2 -2 z" />
	),
	"callout-oval": (
		<g>
			<ellipse cx="12" cy="10" rx="9" ry="6" />
			<path d="M8 15.4 L5.5 21 L11 16.3" />
		</g>
	),
	"callout-cloud": (
		<g>
			<path d="M20.1 9.3 C21.6 10.8 20.7 12.6 18.3 13 C18.7 15.5 16.4 16.5 13.7 15 C11.8 17.4 9.2 17 8.5 14.3 C5.8 14.7 4.1 13.2 5.1 11.3 C3.2 10.3 3.2 8.3 5.1 7.3 C4.1 5.3 5.8 3.8 8.5 4.3 C9.2 1.6 11.8 1.2 13.7 3.6 C16.4 2.1 18.7 3.1 18.3 5.6 C20.7 5.9 21.6 7.8 20.1 9.3 Z" />
			<circle cx="6.6" cy="18.7" r="1.5" />
			<circle cx="4.1" cy="21" r="1" />
		</g>
	),
	heart: (
		<path d="M12 21 C4 15.5, 2 11.5, 4.3 8 C6.3 5, 10.3 5.3, 12 8.5 C13.7 5.3, 17.7 5, 19.7 8 C22 11.5, 20 15.5, 12 21 Z" />
	),
	lightning: <path d="M13 2 L5 13 h5 l-2 9 l9 -12 h-5.5 l2.5 -8 z" />,
}

/** same order as Paint's gallery. */
export const SHAPE_ORDER: ShapeKind[] = [
	"line",
	"curve",
	"oval",
	"rect",
	"rounded-rect",
	"polygon",
	"right-triangle",
	"triangle",
	"diamond",
	"pentagon",
	"hexagon",
	"arrow-right",
	"arrow-left",
	"arrow-up",
	"arrow-down",
	"star-4",
	"star-5",
	"star-6",
	"callout-rounded",
	"callout-oval",
	"callout-cloud",
	"heart",
	"lightning",
]

export const SHAPE_LABEL_KEYS: Record<ShapeKind, string> = {
	line: "ribbon.shapes.line",
	curve: "ribbon.shapes.curve",
	oval: "ribbon.shapes.oval",
	rect: "ribbon.shapes.rect",
	"rounded-rect": "ribbon.shapes.rounded-rect",
	polygon: "ribbon.shapes.polygon",
	"right-triangle": "ribbon.shapes.right-triangle",
	triangle: "ribbon.shapes.triangle",
	diamond: "ribbon.shapes.diamond",
	pentagon: "ribbon.shapes.pentagon",
	hexagon: "ribbon.shapes.hexagon",
	"arrow-right": "ribbon.shapes.arrow-right",
	"arrow-left": "ribbon.shapes.arrow-left",
	"arrow-up": "ribbon.shapes.arrow-up",
	"arrow-down": "ribbon.shapes.arrow-down",
	"star-4": "ribbon.shapes.star-4",
	"star-5": "ribbon.shapes.star-5",
	"star-6": "ribbon.shapes.star-6",
	"callout-rounded": "ribbon.shapes.callout-rounded",
	"callout-oval": "ribbon.shapes.callout-oval",
	"callout-cloud": "ribbon.shapes.callout-cloud",
	heart: "ribbon.shapes.heart",
	lightning: "ribbon.shapes.lightning",
}
