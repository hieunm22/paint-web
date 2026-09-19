import type { ColorSlotProps } from "../types"

/** Color 1 and Color 2 slot; the one being edited gets a thick blue border. */
export function ColorSlot({ label, hex, editing, onClick }: ColorSlotProps) {
	return (
		<button
			type="button"
			className={`colors__slot${editing ? " colors__slot--editing" : ""}`}
			aria-pressed={editing}
			onClick={onClick}
		>
			<span className="colors__slot-swatch" style={{ background: hex }} />
			<span className="colors__slot-label">{label}</span>
		</button>
	)
}
