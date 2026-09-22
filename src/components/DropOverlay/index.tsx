import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { useAppSelector } from "store/hooks"
import "./DropOverlay.scss"

/**
 * what a dragged picture looks like before it lands. it never takes the
 * pointer: the drop has to reach the window listener underneath.
 */
export function DropOverlay() {
	const { t } = useTranslation()
	const dragging = useAppSelector(s => s.ui.draggingFile)

	if (!dragging) return null

	return (
		<div className="drop-overlay" aria-hidden>
			<div className="drop-overlay__frame">
				<Icon name="open" size={16} />
				<span>{t("drop.overlay.label")}</span>
			</div>
		</div>
	)
}
