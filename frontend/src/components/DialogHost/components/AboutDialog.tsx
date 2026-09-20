import { useTranslation } from "react-i18next"
import { INTRO_PAGE_URL } from "common/constant"
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
				<p className="dialog__para">
					<a
						className="dialog__link"
						href={INTRO_PAGE_URL}
						target="_blank"
						rel="noreferrer"
					>
						{t("dialog.about.intro-link")}
					</a>
				</p>
			</div>
		</Dialog>
	)
}
