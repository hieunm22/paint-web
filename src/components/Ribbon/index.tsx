import classnames from "classnames"
import { useTranslation } from "react-i18next"
import { RIBBON_TABS } from "./constant"
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
import { closeBackstage, openBackstage, setTab } from "store/slices/uiSlice"
import "./Ribbon.scss"

export function Ribbon() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const tab = useAppSelector(s => s.ui.tab)
	const textTab = useAppSelector(s => s.ui.textTab)
	const backstageOpen = useAppSelector(s => s.ui.backstageOpen)
	const roving = useRovingFocus()
	const textTabCls = classnames("ribbon__tab ribbon__tab--contextual", {
		"ribbon__tab--active": tab === "text",
	})

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
							onClick={() => dispatch(setTab(id))}
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
						onClick={() => dispatch(setTab("text"))}
					>
						{t("ribbon.tab.text")}
					</button>
				)}
			</div>

			<div
				className="ribbon__content"
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
		</>
	)
}
