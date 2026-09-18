import { Icon } from "components/Icon"
import { useAppSelector } from "store"
import { QuickAccessToolbar, WindowButtons } from "./components"
import "./TitleBar.scss"

/** Quick Access Toolbar, window title and the three window buttons. */
export function TitleBar() {
	const { fileName, isDirty } = useAppSelector((s) => s.doc)

	return (
		<div className="title-bar">
			<span
				className="title-bar__app-icon"
				aria-hidden
			>
				<Icon
					name="brush"
					size={9}
				/>
			</span>

			<QuickAccessToolbar />

			<div className="title-bar__title">
				{isDirty ? "*" : ""}
				{fileName} - Paint
			</div>

			<WindowButtons />
		</div>
	)
}
