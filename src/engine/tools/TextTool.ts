import {
	POINT_TO_PIXEL,
	TEXT_BOX_DEFAULT,
	TEXT_LINE_HEIGHT,
	TEXT_PADDING,
} from "common/constant"
import {
	clampPoint,
	clampRect,
	insideRect,
	rectFromPoints,
} from "engine/geometry"
import { reportTextBox } from "engine/overlay"
import { translate } from "locales/translate"
import { hideTextTab, showTextTab } from "store/slices/uiSlice"
import type { Modifiers, Tool, ToolContext } from "types/engine.types"
import type {
	Point,
	Rect,
	TextOptions,
	ToolId,
} from "types/store.types"

const ORIGIN: Point = { x: 0, y: 0 }

/** a drag shorter than this on either side counts as a click. */
const MIN_DRAG = 4

/** thickness of the underline and the strikethrough rules. */
const RULE = 1

/** where the strikethrough crosses the glyphs, as a fraction of the em. */
const STRIKE_AT = 0.62

/**
 * the text box is a real textarea the viewport lays over the picture. this
 * tool owns where the box sits and bakes what it holds onto the bitmap.
 */
export class TextTool implements Tool {
	readonly id: ToolId = "text"

	get label(): string {
		return translate("history.label.text")
	}

	private box: Rect | null = null
	private value = ""
	private anchor: Point = ORIGIN
	private dragging = false

	begin(pt: Point, _mods: Modifiers, ctx: ToolContext): void {
		const at = clampPoint(pt, ctx.doc)
		this.anchor = at
		this.dragging = true
		this.box = { x: at.x, y: at.y, w: 0, h: 0 }
	}

	update(pts: Point[], _mods: Modifiers, ctx: ToolContext): void {
		const last = pts[pts.length - 1]
		if (!last || !this.dragging) return

		this.box = rectFromPoints(this.anchor, clampPoint(last, ctx.doc))
		reportTextBox(this.box)
	}

	/** a click opens a default box; a drag opens the one that was dragged. */
	end(_pt: Point, _mods: Modifiers, ctx: ToolContext): void {
		if (!this.dragging) return

		this.dragging = false
		const box = this.box
		if (!box) return

		this.value = ""
		this.box =
			box.w < MIN_DRAG || box.h < MIN_DRAG
				? {
						x: this.anchor.x,
						y: this.anchor.y,
						w: TEXT_BOX_DEFAULT.width,
						h: TEXT_BOX_DEFAULT.height,
					}
				: box
		reportTextBox(this.box)
		ctx.dispatch(showTextTab())
	}

	isPending(): boolean {
		return this.box !== null
	}

	hitTest(pt: Point): boolean {
		return this.box !== null && insideRect(this.box, pt)
	}

	get bounds(): Rect | null {
		return this.box
	}

	/** the textarea hands its value over on every keystroke, ready for the bake. */
	setValue(value: string): void {
		this.value = value
	}

	/** the box is dragged by its border, carrying the text along unchanged. */
	moveTo(x: number, y: number): void {
		if (!this.box) return

		this.box = { ...this.box, x, y }
		reportTextBox(this.box)
	}

	/** the box grows downwards as the text outgrows it, the way Paint's does. */
	growTo(height: number): void {
		if (!this.box || height <= this.box.h) return

		this.box = { ...this.box, h: height }
		reportTextBox(this.box)
	}

	commit(ctx: ToolContext): void {
		const box = this.box
		const text = this.value
		this.close(ctx)
		if (!box || !text) {
			ctx.surface.clearPreview()
			return
		}

		paintText(ctx, box, text)
		const dirty = clampRect(box, ctx.doc)
		if (dirty) ctx.markDirty(dirty)
	}

	cancel(ctx: ToolContext): void {
		this.close(ctx)
		ctx.surface.clearPreview()
	}

	private close(ctx: ToolContext): void {
		this.box = null
		this.value = ""
		this.dragging = false
		reportTextBox(null)
		ctx.dispatch(hideTextTab())
	}
}

/**
 * writes the box onto preview, which the engine then bakes into base. the
 * glyphs sit where the textarea drew them: centered in a line of their own.
 */
function paintText(ctx: ToolContext, box: Rect, value: string): void {
	const options = ctx.text
	const em = options.fontSize * POINT_TO_PIXEL
	const line = Math.round(em * TEXT_LINE_HEIGHT)
	const inset = Math.round((line - em) / 2)
	const { preview } = ctx

	preview.save()
	if (options.background === "opaque") {
		preview.fillStyle = ctx.color2
		preview.fillRect(box.x, box.y, box.w, box.h)
	}
	preview.font = fontOf(options, em)
	preview.textBaseline = "top"
	preview.fillStyle = ctx.color1

	value.split("\n").forEach((text, index) => {
		const x = box.x + TEXT_PADDING
		const y = box.y + TEXT_PADDING + index * line + inset
		preview.fillText(text, x, y)

		const width = preview.measureText(text).width
		if (options.underline) preview.fillRect(x, y + em, width, RULE)
		if (options.strikethrough) {
			preview.fillRect(x, y + em * STRIKE_AT, width, RULE)
		}
	})
	preview.restore()
}

/** the css font shorthand: style, then weight, then size and family. */
function fontOf(options: TextOptions, em: number): string {
	const style = options.italic ? "italic " : ""
	const weight = options.bold ? "bold " : ""

	return `${style}${weight}${em}px "${options.fontFamily}", sans-serif`
}
