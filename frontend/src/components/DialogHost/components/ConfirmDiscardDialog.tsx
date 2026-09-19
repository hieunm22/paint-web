import { useAppDispatch, useAppSelector } from "store/hooks"
import { closeDialog } from "store/slices/uiSlice"
import { Dialog } from "./Dialog"

/** confirms before discarding unsaved changes. */
export function ConfirmDiscardDialog() {
	const dispatch = useAppDispatch()
	const fileName = useAppSelector((s) => s.doc.fileName)
	const close = () => dispatch(closeDialog())

	return (
		<Dialog
			title="Paint"
			width={402}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						onClick={close}
					>
						Save
					</button>
					<button type="button" className="dialog__btn" onClick={close}>
						Don't Save
					</button>
					<button type="button" className="dialog__btn" onClick={close}>
						Cancel
					</button>
				</>
			}
		>
			<div className="dialog__body dialog__body--roomy">
				Do you want to save changes to {fileName}?
			</div>
		</Dialog>
	)
}
