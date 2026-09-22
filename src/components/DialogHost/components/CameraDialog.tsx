import { useTranslation } from "react-i18next"
import { Dialog } from "./Dialog"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch } from "store/hooks"
import { useCamera } from "../hooks"
import { closeDialog, showToast } from "store/slices/uiSlice"

/** From camera: one frame of the live stream becomes the document. */
export function CameraDialog() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const files = useFileCommands()
	const camera = useCamera(blob => {
		dispatch(closeDialog())
		void files.openCapture(blob).catch(() => {
			dispatch(showToast("toast.camera.failed"))
		})
	})

	return (
		<Dialog
			title={t("dialog.from-camera.title")}
			width={420}
			footer={
				<>
					<button
						type="button"
						className="dialog__btn dialog__btn--primary"
						disabled={!camera.ready}
						onClick={camera.capture}
					>
						{t("dialog.from-camera.capture")}
					</button>
					<button
						type="button"
						className="dialog__btn"
						onClick={() => dispatch(closeDialog())}
					>
						{t("dialog.common.cancel")}
					</button>
				</>
			}
		>
			<div className="dialog__body dialog__body--roomy">
				<div className="dialog__camera">
					<video
						ref={camera.videoRef}
						className="dialog__camera-view"
						aria-label={t("dialog.from-camera.preview")}
						playsInline
						muted
					/>
					{!camera.ready && (
						<div className="dialog__camera-note">
							{t(camera.errorKey ?? "dialog.from-camera.starting")}
						</div>
					)}
				</div>
				<div className="dialog__hint dialog__hint--flush">
					{t("dialog.from-camera.hint")}
				</div>
			</div>
		</Dialog>
	)
}
