import { useSyncExternalStore } from "react"
import { useTranslation } from "react-i18next"
import { getAnnouncement, subscribeAnnouncement } from "engine/announce"
import "./LiveRegion.scss"

/**
 * off screen and never seen: it reads out what the picture just did, which a
 * canvas cannot say for itself.
 */
export function LiveRegion() {
	const { t } = useTranslation()
	const message = useSyncExternalStore(subscribeAnnouncement, getAnnouncement)

	return (
		<div
			className="live-region"
			role="status"
			aria-live="polite"
			aria-atomic
			aria-label={t("live.region.label")}
		>
			{message}
		</div>
	)
}
