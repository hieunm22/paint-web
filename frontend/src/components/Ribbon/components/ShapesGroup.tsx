import { shapeHasInterior } from "../common"
import { Icon } from "components/Icon"
import { RibbonGroup } from "components/RibbonGroup"
import { ShapeIcon } from "components/ShapeIcon"
import { SHAPE_LABELS, SHAPE_ORDER } from "components/ShapeIcon/constant"
import { useShapeGalleryScroll } from "../hooks"
import { useAppDispatch, useAppSelector } from "store"
import { setFill, setOutline, setShape } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"
import {
	SHAPE_GALLERY_COLS,
	SHAPE_GALLERY_ROW_HEIGHT,
	SHAPE_GALLERY_VISIBLE_ROWS,
} from "../constant"
import { StrokeMenuButton } from "./StrokeMenuButton"

/** 23-shape gallery that scrolls by row, plus the Outline and Fill menus. */
export function ShapesGroup() {
	const dispatch = useAppDispatch()
	const { shape, outline, fill } = useAppSelector((s) => s.tool)
	const openMenu = useAppSelector((s) => s.ui.openMenu)
	const scroll = useShapeGalleryScroll(SHAPE_ORDER.length)
	const hasInterior = shapeHasInterior(shape)

	return (
		<RibbonGroup label="Shapes">
			<div className="shape-gallery">
				<div
					className="shape-gallery__viewport"
					style={{
						height: SHAPE_GALLERY_VISIBLE_ROWS * SHAPE_GALLERY_ROW_HEIGHT,
					}}
				>
					<div
						className="shape-gallery__grid"
						style={{
							gridTemplateColumns: `repeat(${SHAPE_GALLERY_COLS}, 26px)`,
							transform: `translateY(${-scroll.row * SHAPE_GALLERY_ROW_HEIGHT}px)`,
						}}
					>
						{SHAPE_ORDER.map((kind) => (
							<button
								key={kind}
								type="button"
								className={`shape-gallery__cell${
									shape === kind ? " shape-gallery__cell--selected" : ""
								}`}
								title={SHAPE_LABELS[kind]}
								aria-label={SHAPE_LABELS[kind]}
								onClick={() => dispatch(setShape(kind))}
							>
								<ShapeIcon kind={kind} size={18} />
							</button>
						))}
					</div>
				</div>

				<div className="shape-gallery__scroller">
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title="Scroll up"
						disabled={!scroll.canScrollUp}
						onClick={scroll.scrollUp}
					>
						▲
					</button>
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title="Scroll down"
						disabled={!scroll.canScrollDown}
						onClick={scroll.scrollDown}
					>
						▼
					</button>
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title="Show all shapes"
					>
						<Icon name="caretDown" size={8} />
					</button>
				</div>

				<div className="shape-gallery__options">
					<StrokeMenuButton
						menuId="outline"
						label="Outline"
						value={outline}
						disabled={!hasInterior}
						open={openMenu === "outline"}
						onToggle={() => dispatch(toggleMenu("outline"))}
						onPick={(style) => dispatch(setOutline(style))}
					/>
					<StrokeMenuButton
						menuId="fill"
						label="Fill"
						value={fill}
						disabled={!hasInterior}
						open={openMenu === "fill"}
						onToggle={() => dispatch(toggleMenu("fill"))}
						onPick={(style) => dispatch(setFill(style))}
					/>
				</div>
			</div>
		</RibbonGroup>
	)
}
