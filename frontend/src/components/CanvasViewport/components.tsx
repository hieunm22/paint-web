import { useTranslation } from "react-i18next"
import { HANDLES, RULER_SIZE } from "./constant"
import { buildRulerTicks } from "./common"
import type { RulerProps } from "./types"

/** ruler drawn as SVG, which keeps the ticks crisp at every zoom level. */
export function Ruler({ orientation, length, zoom }: RulerProps) {
	const horizontal = orientation === "h"
	const ticks = buildRulerTicks(length, zoom)
	const px = length * zoom

	return (
		<div className={`canvas__ruler canvas__ruler--${orientation}`} aria-hidden>
			<svg
				width={horizontal ? px + 40 : RULER_SIZE}
				height={horizontal ? RULER_SIZE : px + 40}
				shapeRendering="crispEdges"
			>
				{ticks.map((tick) =>
					horizontal ? (
						<line
							key={tick.pos}
							x1={tick.pos}
							y1={RULER_SIZE - tick.size}
							x2={tick.pos}
							y2={RULER_SIZE}
							stroke="#6a7383"
							strokeWidth={1}
						/>
					) : (
						<line
							key={tick.pos}
							x1={RULER_SIZE - tick.size}
							y1={tick.pos}
							x2={RULER_SIZE}
							y2={tick.pos}
							stroke="#6a7383"
							strokeWidth={1}
						/>
					),
				)}
				{ticks
					.filter((t) => t.label !== undefined)
					.map((tick) =>
						horizontal ? (
							<text
								key={`l${tick.pos}`}
								x={tick.pos + 2}
								y={9}
								fontSize={8}
								fill="#4a4a4a"
							>
								{tick.label}
							</text>
						) : (
							<text
								key={`l${tick.pos}`}
								x={7}
								y={tick.pos + 2}
								fontSize={8}
								fill="#4a4a4a"
								transform={`rotate(-90 7 ${tick.pos + 2})`}
							>
								{tick.label}
							</text>
						),
					)}
			</svg>
		</div>
	)
}

/**
 * eight document resize handles: dragging adds white space or crops,
 * it never scales the content. Drag behaviour is not wired up yet.
 */
export function ResizeHandles() {
	return (
		<>
			{HANDLES.map((pos) => (
				<span key={pos} className={`canvas__handle canvas__handle--${pos}`} />
			))}
		</>
	)
}

export function Thumbnail() {
	const { t } = useTranslation()

	return (
		<div className="canvas__thumbnail">
			<div className="canvas__thumbnail-title">
				{t("canvas.thumbnail.title")}
			</div>
			<div className="canvas__thumbnail-body" />
		</div>
	)
}
