import { useTranslation } from "react-i18next"
import { documentName } from "store/common"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppSelector } from "store/hooks"
import { Dialog } from "./Dialog"

/** confirms before discarding unsaved changes. */
export function ConfirmDiscardDialog() {
	const { t } = useTranslation()
	const files = useFileCommands()
	const fileName = useAppSelector((s) => s.doc.fileName)

	// a save the user backed out of must not take the document with it
	const saveThenResume = async () => {
		if (await files.save()) files.resume()
	}

	return (
		<Dialog
			title={t("dialog.confirm-discard.title")}
			width={402}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={() => void saveThenResume()}
					>
						{t("dialog.confirm-discard.save")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => files.resume()}
					>
						{t("dialog.confirm-discard.dont-save")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => files.cancelPending()}
					>
						{t("dialog.common.cancel")}
					</button>
				</>
			}
		>
			<div className="dialog__body dialog__body--roomy">
				{t("dialog.confirm-discard.message", { 0: documentName(fileName) })}
			</div>
		</Dialog>
	)
}
