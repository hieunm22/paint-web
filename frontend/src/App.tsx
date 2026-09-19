import { CanvasViewport } from "components/CanvasViewport"
import { DialogHost } from "components/DialogHost"
import { FileMenu } from "components/FileMenu"
import { Ribbon } from "components/Ribbon"
import { StatusBar } from "components/StatusBar"
import { TitleBar } from "components/TitleBar"
import { useDismissMenus } from "hooks/useDismissMenus"
import { useKeyboardShortcuts } from "hooks/useKeyboardShortcuts"
import { useAppSelector } from "store/hooks"
import "./App.scss"

/** app shell: title bar 32px, tab strip 24px, ribbon 94px, then canvas and status bar. */
export default function App() {
	useDismissMenus()
	useKeyboardShortcuts()
	const backstageOpen = useAppSelector((s) => s.ui.backstageOpen)
	const showStatusBar = useAppSelector((s) => s.view.showStatusBar)

	return (
		<div className="app">
			<TitleBar />

			<div className="app__main">
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
