import { useEffect } from "react"
import { writeViewToggles } from "store/common"
import { useAppSelector } from "store/hooks"

export function useViewPersistence() {
	const showRuler = useAppSelector(s => s.view.showRuler)
	const showGrid = useAppSelector(s => s.view.showGrid)
	const showStatusBar = useAppSelector(s => s.view.showStatusBar)

	useEffect(() => {
		writeViewToggles({ showRuler, showGrid, showStatusBar })
	}, [showRuler, showGrid, showStatusBar])
}
