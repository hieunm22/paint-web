import { useAppDispatch, useAppSelector } from "store"
import { openBackstage, setTab } from "store/slices/uiSlice"
import { BrushesGroup } from "./components/BrushesGroup"
import { ClipboardGroup } from "./components/ClipboardGroup"
import { ColorsGroup } from "./components/ColorsGroup"
import { ExtrasGroup } from "./components/ExtrasGroup"
import { ImageGroup } from "./components/ImageGroup"
import { ShapesGroup } from "./components/ShapesGroup"
import { SizeGroup } from "./components/SizeGroup"
import { ToolsGroup } from "./components/ToolsGroup"
import { ViewTabGroups } from "./components/ViewGroups"
import { RIBBON_TABS } from "./constant"
import "./Ribbon.scss"

export function Ribbon() {
	const dispatch = useAppDispatch()
	const tab = useAppSelector((s) => s.ui.tab)

	return (
		<>
			<div
				className="ribbon__tab-strip"
				role="tablist"
			>
				<button
					type="button"
					className="ribbon__tab ribbon__tab--file"
					onClick={() => dispatch(openBackstage())}
				>
					File
				</button>
				{RIBBON_TABS.map(({ id, label }) => (
					<button
						key={id}
						type="button"
						role="tab"
						aria-selected={tab === id}
						className={`ribbon__tab${tab === id ? " ribbon__tab--active" : ""}`}
						onClick={() => dispatch(setTab(id))}
					>
						{label}
					</button>
				))}
			</div>

			<div
				className="ribbon__content"
				role="tabpanel"
			>
				{tab === "home" ? (
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
				) : (
					<ViewTabGroups />
				)}
			</div>
		</>
	)
}
