import { CanvasViewport } from "components/CanvasViewport"
import { DialogHost } from "components/DialogHost"
import { FileMenu } from "components/FileMenu"
import { Ribbon } from "components/Ribbon"
import { StatusBar } from "components/StatusBar"
import { TitleBar } from "components/TitleBar"
import { useDismissMenus } from "hooks/useDismissMenus"
import { useAppSelector } from "store"
import "./App.scss"

/** app shell: title bar 32px, tab strip 24px, ribbon 94px, then canvas and status bar. */
export default function App() {
	useDismissMenus()
	const backstageOpen = useAppSelector((s) => s.ui.backstageOpen)
	const showStatusBar = useAppSelector((s) => s.view.showStatusBar)

	return (
		<div className="app">
			<TitleBar />

			<div className="app__main" data-menu-root>
				<div className="app__chrome">
					<Ribbon />
				</div>
				<CanvasViewport />
			</div>

			{showStatusBar && <StatusBar />}
			{backstageOpen && <FileMenu />}
			<DialogHost />
		</div>
	)
}
