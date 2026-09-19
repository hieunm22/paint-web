import { useTranslation } from "react-i18next"
import { LargeButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useFileCommands } from "hooks/useFileCommands"

export function ExtrasGroup() {
	const { t } = useTranslation()
	const files = useFileCommands()

	return (
		<RibbonGroup label={t("ribbon.extras.label")}>
			<LargeButton
				label={t("ribbon.extras.copy")}
				icon="clipboard"
				title={t("ribbon.extras.copy-tooltip")}
				onClick={() => void files.copyImage()}
			/>
		</RibbonGroup>
	)
}
