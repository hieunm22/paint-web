import { AboutDialog } from "./components/AboutDialog"
import { ConfirmDiscardDialog } from "./components/ConfirmDiscardDialog"
import { EditColorsDialog } from "./components/EditColorsDialog"
import { ImagePropertiesDialog } from "./components/ImagePropertiesDialog"
import { ResizeSkewDialog } from "./components/ResizeSkewDialog"
import { SaveAsDialog } from "./components/SaveAsDialog"
import { useAppSelector } from "store/hooks"
import "./DialogHost.scss"

export function DialogHost() {
	const dialog = useAppSelector(s => s.ui.dialog)

	switch (dialog) {
		case "resize-skew":
			return <ResizeSkewDialog />
		case "edit-colors":
			return <EditColorsDialog />
		case "image-properties":
			return <ImagePropertiesDialog />
		case "save-as":
			return <SaveAsDialog />
		case "confirm-discard":
			return <ConfirmDiscardDialog />
		case "about":
			return <AboutDialog />
		default:
			return null
	}
}
