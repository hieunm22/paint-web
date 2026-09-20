import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useToastTimeout } from "./hooks"
import { dismissToast } from "store/slices/uiSlice"
import "./Toast.scss"

/** transient notice above the status bar; the store holds the key, not the text. */
export function Toast() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const toast = useAppSelector((s) => s.ui.toast)
	useToastTimeout(toast)

	if (!toast) return null

	return (
		<div className="toast" role="status">
			<span className="toast__text">{t(toast)}</span>
			<button
				type="button"
				className="toast__close"
				aria-label={t("dialog.common.close")}
				onClick={() => dispatch(dismissToast())}
			>
				<Icon name="close" size={10} />
			</button>
		</div>
	)
}
