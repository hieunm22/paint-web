import { useTranslation } from "react-i18next"
import { SHAPE_ORDER } from "components/ShapeIcon/constant"
import {
	SHAPE_GALLERY_COLS,
	SHAPE_GALLERY_ROW_HEIGHT,
	SHAPE_GALLERY_VISIBLE_ROWS,
	SHAPE_PANEL_WIDTH,
} from "../constant"
import { Icon } from "components/Icon"
import { Menu, MenuAnchor } from "components/Menu"
import { RibbonGroup } from "components/RibbonGroup"
import { shapeHasInterior } from "../common"
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useShapeGalleryScroll } from "../hooks"
import { setFill, setOutline, setShape } from "store/slices/toolSlice"
import { toggleMenu } from "store/slices/uiSlice"
import { ShapeCell } from "./ShapeCell"
import { StrokeMenuButton } from "./StrokeMenuButton"

/** 23-shape gallery that scrolls by row, plus the Outline and Fill menus. */
export function ShapesGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const { shape, outline, fill } = useAppSelector((s) => s.tool)
	const openMenu = useAppSelector((s) => s.ui.openMenu)
	const scroll = useShapeGalleryScroll(SHAPE_ORDER.length)
	const hasInterior = shapeHasInterior(shape)
	const ready = Boolean(IMPLEMENTED.shape)

	return (
		<RibbonGroup label={t("ribbon.shapes.label")}>
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
							<ShapeCell
								key={kind}
								kind={kind}
								selected={ready && shape === kind}
								disabled={!ready}
								onPick={(picked) => dispatch(setShape(picked))}
							/>
						))}
					</div>
				</div>

				<div className="shape-gallery__scroller">
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title={t("ribbon.shapes.scroll-up")}
						disabled={!scroll.canScrollUp}
						onClick={scroll.scrollUp}
					>
						<Icon name="caretUp" size={8} />
					</button>
					<button
						type="button"
						className="shape-gallery__scroll-btn"
						title={t("ribbon.shapes.scroll-down")}
						disabled={!scroll.canScrollDown}
						onClick={scroll.scrollDown}
					>
						<Icon name="caretDown" size={8} />
					</button>
					<MenuAnchor className="shape-gallery__expand">
						<button
							type="button"
							className="shape-gallery__scroll-btn"
							title={t("ribbon.shapes.show-all")}
							aria-expanded={openMenu === "shapes"}
							disabled={!ready}
							onClick={() => dispatch(toggleMenu("shapes"))}
						>
							<Icon name="caretDown" size={8} />
						</button>
						{openMenu === "shapes" && (
							<Menu width={SHAPE_PANEL_WIDTH}>
								<div className="shape-gallery__panel">
									{SHAPE_ORDER.map((kind) => (
										<ShapeCell
											key={kind}
											kind={kind}
											selected={shape === kind}
											disabled={!ready}
											onPick={(picked) => dispatch(setShape(picked))}
										/>
									))}
								</div>
							</Menu>
						)}
					</MenuAnchor>
				</div>

				<div className="shape-gallery__options">
					<StrokeMenuButton
						menuId="outline"
						label={t("ribbon.shapes.outline")}
						value={outline}
						disabled={!ready}
						open={openMenu === "outline"}
						onToggle={() => dispatch(toggleMenu("outline"))}
						onPick={(style) => dispatch(setOutline(style))}
					/>
					<StrokeMenuButton
						menuId="fill"
						label={t("ribbon.shapes.fill")}
						value={fill}
						disabled={!ready || !hasInterior}
						open={openMenu === "fill"}
						onToggle={() => dispatch(toggleMenu("fill"))}
						onPick={(style) => dispatch(setFill(style))}
					/>
				</div>
			</div>
		</RibbonGroup>
	)
}
