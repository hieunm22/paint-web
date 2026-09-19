import { useTranslation } from "react-i18next"
import { Dialog } from "./Dialog"

export function AboutDialog() {
	const { t } = useTranslation()

	return (
		<Dialog title={t("dialog.about.title")} width={360}>
			<div className="dialog__body">
				<div className="dialog__app-name">{t("dialog.about.app-name")}</div>
				<p className="dialog__para">{t("dialog.about.body")}</p>
				<p className="dialog__para dialog__para--muted">
					{t("dialog.about.disclaimer")}
				</p>
			</div>
		</Dialog>
	)
}
