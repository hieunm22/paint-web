import classnames from "classnames"
import { useTranslation } from "react-i18next"
import { RIBBON_TABS } from "./constant"
import { Icon } from "components/Icon"
import { BrushesGroup } from "./components/BrushesGroup"
import { ClipboardGroup } from "./components/ClipboardGroup"
import { ColorsGroup } from "./components/ColorsGroup"
import { ExtrasGroup } from "./components/ExtrasGroup"
import { ImageGroup } from "./components/ImageGroup"
import { ShapesGroup } from "./components/ShapesGroup"
import { SizeGroup } from "./components/SizeGroup"
import { TextTabGroups } from "./components/TextGroups"
import { ToolsGroup } from "./components/ToolsGroup"
import { ViewTabGroups } from "./components/ViewGroups"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useRovingFocus } from "./hooks"
import {
	closeBackstage,
	collapseRibbon,
	openBackstage,
	peekRibbon,
	pinRibbon,
	setTab,
} from "store/slices/uiSlice"
import type { RibbonTabId } from "types/store.types"
import "./Ribbon.scss"

export function Ribbon() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const tab = useAppSelector(s => s.ui.tab)
	const textTab = useAppSelector(s => s.ui.textTab)
	const backstageOpen = useAppSelector(s => s.ui.backstageOpen)
	const ribbon = useAppSelector(s => s.ui.ribbon)
	const roving = useRovingFocus()
	const collapsed = ribbon !== "open"
	const minimizeLabel = t(
		collapsed ? "ribbon.toolbar.pin" : "ribbon.toolbar.minimize",
	)
	const contentCls = classnames("ribbon__content", {
		"ribbon__content--peek": ribbon === "peek",
	})
	const textTabCls = classnames("ribbon__tab ribbon__tab--contextual", {
		"ribbon__tab--active": tab === "text",
	})

	// a tab picked while minimised brings the ribbon out until the next
	// click outside it
	const pickTab = (id: RibbonTabId) => {
		dispatch(setTab(id))
		if (collapsed) dispatch(peekRibbon())
	}

	const toggleBackstage = () => {
		if (backstageOpen)
			dispatch(closeBackstage())
		else
			dispatch(openBackstage())
	}

	return (
		<>
			<div
				className="ribbon__tab-strip"
				role="tablist"
				aria-label={t("ribbon.tab.strip")}
			>
				<button
					type="button"
					className="ribbon__tab ribbon__tab--file"
					aria-haspopup="menu"
					aria-expanded={backstageOpen}
					onClick={toggleBackstage}
				>
					{t("ribbon.tab.file")}
				</button>
				{RIBBON_TABS.map(({ id, labelKey }) => {
					const cls = classnames("ribbon__tab", {
						"ribbon__tab--active": tab === id,
					})

					return (
						<button
							key={id}
							type="button"
							role="tab"
							aria-selected={tab === id}
							className={cls}
							onClick={() => pickTab(id)}
						>
							{t(labelKey)}
						</button>
					)
				})}
				{/* contextual: on the strip only while a text box is open. */}
				{textTab && (
					<button
						type="button"
						role="tab"
						aria-selected={tab === "text"}
						className={textTabCls}
						onClick={() => pickTab("text")}
					>
						{t("ribbon.tab.text")}
					</button>
				)}

				<button
					type="button"
					className="ribbon__minimize"
					title={minimizeLabel}
					aria-label={minimizeLabel}
					aria-expanded={!collapsed}
					onClick={() => dispatch(collapsed ? pinRibbon() : collapseRibbon())}
				>
					<Icon name={collapsed ? "caretDown" : "caretUp"} size={12} />
				</button>
			</div>

			{ribbon !== "collapsed" && (
				<div
					className={contentCls}
					ref={roving.ref}
					role="toolbar"
					aria-label={t("ribbon.toolbar.label")}
					onKeyDown={roving.onKeyDown}
					onFocus={roving.onFocus}
				>
					{tab === "home" && (
						<>
							<ClipboardGroup />
							<ImageGroup />
							<ToolsGroup />
							<BrushesGroup />
							<ShapesGroup />
							<SizeGroup />
							<ColorsGroup />
							<ExtrasGroup />
						</>
					)}
					{tab === "view" && <ViewTabGroups />}
					{tab === "text" && <TextTabGroups />}
				</div>
			)}
		</>
	)
}
