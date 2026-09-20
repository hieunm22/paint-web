import { useTranslation } from "react-i18next"
import {
	NO_AUTOFILL,
	POINT_TO_PIXEL,
	TEXT_GRAB_BAND,
	TEXT_LINE_HEIGHT,
	TEXT_PADDING,
} from "common/constant"
import { HANDLES, RULER_SIZE, THUMBNAIL_BOX } from "./constant"
import { buildRulerTicks, textDecoration, textFrameBox } from "./common"
import { useAppSelector } from "store/hooks"
import {
	useDocumentResize,
	useTextBox,
	useTextBoxDrag,
	useThumbnail,
} from "./hooks"
import type {
	ResizeHandlesProps,
	RulerProps,
	TextBoxProps,
	ThumbnailProps,
} from "./types"

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
 * the three edges the paper can be dragged by: it gains white space or is
 * cropped, and the picture inside is never scaled.
 */
export function ResizeHandles({ doc, zoom }: ResizeHandlesProps) {
	const { previewRef, handleProps } = useDocumentResize(doc, zoom)

	return (
		<>
			<div ref={previewRef} className="canvas__resize-preview" />
			{HANDLES.map(pos => (
				<span
					key={pos}
					className={`canvas__handle canvas__handle--${pos}`}
					{...handleProps(pos)}
				/>
			))}
		</>
	)
}

/**
 * a real textarea laid over the picture: the caret, the selection and every
 * input method come with it. the engine bakes what it holds on commit.
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
				{...NO_AUTOFILL}
				value={value}
				onChange={onChange}
			/>
		</div>
	)
}

/**
 * the whole picture in miniature, the viewed part framed in red. dragging the
 * frame scrolls the canvas, which is what Paint's thumbnail does.
 */
export function Thumbnail({ zoom, scrollRef }: ThumbnailProps) {
	const { t } = useTranslation()
	const { ref, onPointerDown, onPointerMove } = useThumbnail(zoom, scrollRef)

	return (
		<div className="canvas__thumbnail">
			<div className="canvas__thumbnail-title">
				{t("canvas.thumbnail.title")}
			</div>
			<canvas
				ref={ref}
				className="canvas__thumbnail-body"
				width={THUMBNAIL_BOX.width}
				height={THUMBNAIL_BOX.height}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
			/>
		</div>
	)
}
