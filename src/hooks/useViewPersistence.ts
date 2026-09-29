import { useEffect } from "react"
import { writeSettings } from "common/settings"
import { useAppSelector } from "store/hooks"

export function useViewPersistence() {
	const showRuler = useAppSelector(s => s.view.showRuler)
	const showGrid = useAppSelector(s => s.view.showGrid)
	const showStatusBar = useAppSelector(s => s.view.showStatusBar)

	useEffect(() => {
		writeSettings({ view: { showRuler, showGrid, showStatusBar } })
	}, [showRuler, showGrid, showStatusBar])
}
