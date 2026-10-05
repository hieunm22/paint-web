import type { SVGProps } from "react"
import type { SvgGlyphProps, SvgIconName } from "./types"

const LENS_STROKE: SVGProps<SVGGElement> = {
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.5,
	strokeLinecap: "round",
}

/** one id serves every copy: each mask it names is drawn the same. */
const PREVIEW_MASK = "icon-print-preview-lens"

/** the hand-drawn glyphs, 16 units tall and as wide as the registry says. */
const SVG_GLYPHS: Record<SvgIconName, JSX.Element> = {
	select: (
		<rect
			x="1.25"
			y="1"
			width="17.5"
			height="14"
			fill="none"
			stroke="currentColor"
			strokeWidth="1"
			strokeDasharray="2 1.5"
			strokeDashoffset="1"
		/>
	),
	zoomIn: (
		<g {...LENS_STROKE}>
			<circle cx="6.5" cy="6.5" r="5" />
			<path d="M10.2 10.2 L14.5 14.5 M4.25 6.5 H8.75 M6.5 4.25 V8.75" />
		</g>
	),
	zoomOut: (
		<g {...LENS_STROKE}>
			<circle cx="6.5" cy="6.5" r="5" />
			<path d="M10.2 10.2 L14.5 14.5 M4.25 6.5 H8.75" />
		</g>
	),
	printPreview: (
		<>
			<mask id={PREVIEW_MASK}>
				<rect width="16" height="16" fill="#fff" />
				<g fill="#000" stroke="#000" strokeWidth="3.5" strokeLinecap="round">
					<circle cx="12.5" cy="12" r="2.5" />
					<path d="M14.3 13.8 L15.25 14.75" />
				</g>
			</mask>
			<path
				fill="currentColor"
				fillRule="evenodd"
				mask={`url(#${PREVIEW_MASK})`}
				d="M2 5 V2 A2 2 0 0 1 4 0 H11.1 L14 2.9 V5 H12 V2.9 L11.1 2 H4 V5 Z M2 12 H1 A1 1 0 0 1 0 11 V8 A2 2 0 0 1 2 6 H14 A2 2 0 0 1 16 8 V11 A1 1 0 0 1 15 12 H14 V14 A2 2 0 0 1 12 16 H4 A2 2 0 0 1 2 14 Z M4 11 V14 H12 V11 Z"
			/>
			<g
				fill="none"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			>
				<circle cx="12.5" cy="12" r="2.5" />
				<path d="M14.3 13.8 L15.25 14.75" />
			</g>
		</>
	),
}

/** the inside of one svg icon; the parent draws the svg element around it. */
export function SvgGlyph({ name }: SvgGlyphProps) {
	return SVG_GLYPHS[name]
}
