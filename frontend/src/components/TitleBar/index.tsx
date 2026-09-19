import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { QuickAccessToolbar, WindowButtons } from "./components"
import { windowTitle } from "store/common"
import { useAppSelector } from "store/hooks"
import "./TitleBar.scss"

/** Quick Access Toolbar, window title and the three window buttons. */
export function TitleBar() {
	// no t() of its own; the call is what re-renders the title on a language change
	useTranslation()
	const { fileName, isDirty } = useAppSelector((s) => s.doc)

	return (
		<div className="title-bar">
			<span className="title-bar__app-icon" aria-hidden>
				<Icon name="brush" size={9} />
			</span>

			<QuickAccessToolbar />

			<div className="title-bar__title">{windowTitle(fileName, isDirty)}</div>

			<WindowButtons />
		</div>
	)
}
