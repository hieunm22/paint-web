import { useTranslation } from "react-i18next"
import { SHAPE_LABEL_KEYS } from "components/ShapeIcon/constant"
import { ShapeIcon } from "components/ShapeIcon"
import type { ShapeCellProps } from "../types"

/** one shape of the gallery, shown both in the ribbon strip and the panel. */
export function ShapeCell({
	kind,
	selected,
	disabled,
	onPick,
}: ShapeCellProps) {
	const { t } = useTranslation()
	const label = t(SHAPE_LABEL_KEYS[kind])

	return (
		<button
			type="button"
			className={`shape-gallery__cell${
				selected ? " shape-gallery__cell--selected" : ""
			}`}
			title={label}
			aria-label={label}
			disabled={disabled}
			onClick={() => onPick(kind)}
		>
			<ShapeIcon kind={kind} size={18} />
		</button>
	)
}
