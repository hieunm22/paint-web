import { useTranslation } from "react-i18next"
import {
	POINT_TO_PIXEL,
	TEXT_GRAB_BAND,
	TEXT_LINE_HEIGHT,
	TEXT_PADDING,
} from "common/constant"
import { HANDLES, RULER_SIZE } from "./constant"
import { buildRulerTicks, textDecoration, textFrameBox } from "./common"
import { useAppSelector } from "store/hooks"
import { useTextBox, useTextBoxDrag } from "./hooks"
import type { RulerProps, TextBoxProps } from "./types"

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
				{ticks.map(tick =>
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
					.filter(t => t.label !== undefined)
					.map(tick =>
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
			{HANDLES.map(pos => (
				<span key={pos} className={`canvas__handle canvas__handle--${pos}`} />
			))}
		</>
	)
}

/**
 * the text box is a real textarea laid over the picture: the caret, the
 * selection and every input method come with it for nothing. the engine bakes
 * what it holds onto the bitmap when the box is committed.
 */
export function TextBox({ box, zoom }: TextBoxProps) {
	const { t } = useTranslation()
	const options = useAppSelector(s => s.tool.text)
	const color1 = useAppSelector(s => s.colors.color1)
	const color2 = useAppSelector(s => s.colors.color2)
	const { ref, value, onChange } = useTextBox(zoom)
	const dragProps = useTextBoxDrag(box, zoom)
	const em = options.fontSize * POINT_TO_PIXEL * zoom

	return (
		<div
			className="canvas__text-frame"
			style={textFrameBox(box, zoom, TEXT_GRAB_BAND)}
			{...dragProps}
		>
			<textarea
				ref={ref}
				className="canvas__text"
				style={{
					padding: TEXT_PADDING * zoom,
					fontFamily: `"${options.fontFamily}", sans-serif`,
					fontSize: em,
					lineHeight: `${Math.round(options.fontSize * POINT_TO_PIXEL * TEXT_LINE_HEIGHT) * zoom}px`,
					fontWeight: options.bold ? "bold" : "normal",
					fontStyle: options.italic ? "italic" : "normal",
					textDecoration: textDecoration(options),
					color: color1,
					background: options.background === "opaque" ? color2 : "transparent",
				}}
				aria-label={t("canvas.text.label")}
				autoFocus
				spellCheck={false}
				value={value}
				onChange={onChange}
			/>
		</div>
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
