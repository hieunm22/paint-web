import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import { useAppDispatch } from "store/hooks"
import { useDialogDrag, useDialogFocus } from "../hooks"
import { closeDialog } from "store/slices/uiSlice"
import type { DialogProps } from "../types"

export function Dialog({
	title,
	width,
	children,
	footer,
}: DialogProps) {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const { dialogRef, offset, handleProps } = useDialogDrag()
	useDialogFocus(dialogRef)

	return (
		<div className="dialog__overlay" role="presentation">
			<div
				ref={dialogRef}
				className="dialog"
				style={{ width, transform: `translate(${offset.x}px, ${offset.y}px)` }}
				role="dialog"
				aria-label={title}
				aria-modal
			>
				<div className="dialog__titlebar" {...handleProps}>
					<span className="dialog__title">{title}</span>
					<button
						type="button"
						className="dialog__close"
						aria-label={t("dialog.common.close")}
						onClick={() => dispatch(closeDialog())}
					>
						<Icon name="close" size={12} />
					</button>
				</div>
				{children}
				<div className="dialog__footer">
					{footer ?? (
						<>
							<button
								type="button"
								className="dialog__btn dialog__btn--primary"
								onClick={() => dispatch(closeDialog())}
							>
								{t("dialog.common.ok")}
							</button>
							<button
								type="button"
								className="dialog__btn"
								onClick={() => dispatch(closeDialog())}
							>
								{t("dialog.common.cancel")}
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
