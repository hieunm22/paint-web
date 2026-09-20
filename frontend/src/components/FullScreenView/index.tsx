import { useTranslation } from "react-i18next"
import { useFullScreen } from "./hooks"
import "./FullScreenView.scss"

/**
 * the picture alone on a black ground, scaled to the screen. a click anywhere
 * puts the window back, which is how Paint leaves full screen.
 */
export function FullScreenView() {
	const { t } = useTranslation()
	const { ref, exit } = useFullScreen()

	return (
		<button
			type="button"
			className="full-screen"
			title={t("canvas.full-screen.exit")}
			aria-label={t("canvas.full-screen.exit")}
			onClick={exit}
		>
			<canvas ref={ref} className="full-screen__picture" />
		</button>
	)
}
