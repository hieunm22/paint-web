import { useTranslation } from "react-i18next"
import { documentName } from "store/common"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { closeDialog } from "store/slices/uiSlice"
import { Dialog } from "./Dialog"

/** confirms before discarding unsaved changes. */
export function ConfirmDiscardDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const fileName = useAppSelector((s) => s.doc.fileName)
	const close = () => dispatch(closeDialog())

	return (
		<Dialog
			title={t("dialog.confirm-discard.title")}
			width={402}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={close}
					>
						{t("dialog.confirm-discard.save")}
					</button>
					<button type="button" className="dialog__btn" onClick={close}>
						{t("dialog.confirm-discard.dont-save")}
					</button>
					<button type="button" className="dialog__btn" onClick={close}>
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
