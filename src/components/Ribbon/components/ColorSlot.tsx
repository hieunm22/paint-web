import classnames from "classnames"
import type { ColorSlotProps } from "../types"

/** Color 1 and Color 2 slot; the one being edited gets a thick blue border. */
export function ColorSlot({
	label,
	hex,
	editing,
	onClick,
}: ColorSlotProps) {
	const cls = classnames("colors__slot", {
		"colors__slot--editing": editing,
	})

	return (
		<button
			type="button"
			className={cls}
			aria-pressed={editing}
			onClick={onClick}
		>
			<span className="colors__slot-swatch" style={{ background: hex }} />
			<span className="colors__slot-label">{label}</span>
		</button>
	)
}
