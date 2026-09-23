import { useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
import { SHAPE_ORDER } from "components/ShapeIcon/constant"
import {
	SHAPE_GALLERY_ROW_HEIGHT,
	SHAPE_GALLERY_VISIBLE_ROWS,
	SHAPE_GRID_COLUMNS,
} from "../constant"
import { Icon } from "components/Icon"
import { RibbonGroup } from "components/RibbonGroup"
import { ShapeCell } from "./ShapeCell"
import { StrokeMenuButton } from "./StrokeMenuButton"
import { shapeHasInterior } from "../common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useGalleryBox, useShapeGalleryScroll } from "../hooks"
import { setFill, setOutline, setShape } from "store/slices/toolSlice"
import { closeMenu, toggleMenu } from "store/slices/uiSlice"
import type { ShapeKind } from "types/store.types"

/** 23-shape gallery that scrolls by row, plus the Outline and Fill menus. */
export function ShapesGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const {
		active,
		shape,
		outline,
		fill,
	} = useAppSelector(s => s.tool)
	const openMenu = useAppSelector(s => s.ui.openMenu)
	const scroll = useShapeGalleryScroll(SHAPE_ORDER.length)
	const hasInterior = shapeHasInterior(shape)
	const ready = Boolean(IMPLEMENTED.shape)
	// the gallery remembers the last shape; only the active tool is highlighted
	const drawing = ready && active === "shape"
	const stripRef = useRef<HTMLDivElement>(null)
	const expanded = openMenu === "shapes"
	const box = useGalleryBox(stripRef, expanded)

	const pick = (picked: ShapeKind) => {
		dispatch(setShape(picked))
		if (expanded) dispatch(closeMenu())
	}

	return (
		<RibbonGroup label={t("ribbon.shapes.label")}>
			<div className="shape-gallery">
				<div
					ref={stripRef}
					className="shape-gallery__viewport"
					style={{
						height: SHAPE_GALLERY_VISIBLE_ROWS * SHAPE_GALLERY_ROW_HEIGHT,
					}}
				>
					<div
						className="shape-gallery__grid"
						style={{
							gridTemplateColumns: SHAPE_GRID_COLUMNS,
							transform: `translateY(${-scroll.row * SHAPE_GALLERY_ROW_HEIGHT}px)`,
						}}
					>
						{SHAPE_ORDER.map(kind => (
							<ShapeCell
								key={kind}
								kind={kind}
								selected={drawing && shape === kind}
								disabled={!ready}
								onPick={pick}
							/>
						))}
					</div>
				</div>

				<div className="shape-gallery__scroller">
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title={t("ribbon.shapes.scroll-up")}
						disabled={!scroll.canScrollUp || expanded}
						onClick={scroll.scrollUp}
					>
						<Icon name="caretUp" size={8} />
					</button>
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title={t("ribbon.shapes.scroll-down")}
						disabled={!scroll.canScrollDown || expanded}
						onClick={scroll.scrollDown}
					>
						<Icon name="caretDown" size={8} />
					</button>
					{/* data-menu-root keeps the click that closes it from reopening it */}
					<div className="shape-gallery__expand" data-menu-root>
						<button
							type="button"
							className="shape-gallery__scroll-btn"
							title={t("ribbon.shapes.show-all")}
							aria-expanded={expanded}
							disabled={!ready}
							onClick={() => dispatch(toggleMenu("shapes"))}
						>
							<Icon name={expanded ? "caretUp" : "caretDown"} size={8} />
						</button>
					</div>
				</div>

				{box &&
					createPortal(
						<div
							className="shape-gallery__expanded"
							data-menu-root
							style={{
								top: box.top,
								left: box.left,
								width: box.width,
								gridTemplateColumns: SHAPE_GRID_COLUMNS,
							}}
						>
							{SHAPE_ORDER.map(kind => (
								<ShapeCell
									key={kind}
									kind={kind}
									selected={drawing && shape === kind}
									disabled={!ready}
									onPick={pick}
								/>
							))}
						</div>,
						document.body,
					)}

				<div className="shape-gallery__options">
					<StrokeMenuButton
						menuId="outline"
						label={t("ribbon.shapes.outline")}
						value={outline}
						disabled={!ready}
						open={openMenu === "outline"}
						onToggle={() => dispatch(toggleMenu("outline"))}
						onPick={style => dispatch(setOutline(style))}
					/>
					<StrokeMenuButton
						menuId="fill"
						label={t("ribbon.shapes.fill")}
						value={fill}
						disabled={!ready || !hasInterior}
						open={openMenu === "fill"}
						onToggle={() => dispatch(toggleMenu("fill"))}
						onPick={style => dispatch(setFill(style))}
					/>
				</div>
			</div>
		</RibbonGroup>
	)
}
