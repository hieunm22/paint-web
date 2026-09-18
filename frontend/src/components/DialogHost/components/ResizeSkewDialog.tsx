import { useState } from "react"
import { Dialog } from "./Dialog"

/** Resize and Skew dialog (Ctrl+W). */
export function ResizeSkewDialog() {
	const [unit, setUnit] = useState<"percent" | "pixels">("percent")
	const [ratio, setRatio] = useState(true)

	return (
		<Dialog
			title="Resize and Skew"
			width={318}
		>
			<div className="dialog__body">
				<div className="dialog__section">
					<div className="dialog__section-title">Resize</div>
					<div className="dialog__row">
						<span className="dialog__label">By:</span>
						<label>
							<input
								type="radio"
								name="unit"
								checked={unit === "percent"}
								onChange={() => setUnit("percent")}
							/>{" "}
							Percentage
						</label>
						<label>
							<input
								type="radio"
								name="unit"
								checked={unit === "pixels"}
								onChange={() => setUnit("pixels")}
							/>{" "}
							Pixels
						</label>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">↔ Horizontal:</span>
						<input
							className="dialog__num"
							defaultValue={unit === "percent" ? 100 : 1152}
						/>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">↕ Vertical:</span>
						<input
							className="dialog__num"
							defaultValue={unit === "percent" ? 100 : 648}
						/>
					</div>
					<div className="dialog__row">
						<label>
							<input
								type="checkbox"
								checked={ratio}
								onChange={(e) => setRatio(e.target.checked)}
							/>{" "}
							Maintain aspect ratio
						</label>
					</div>
				</div>

				<div className="dialog__section">
					<div className="dialog__section-title">Skew (Degrees)</div>
					<div className="dialog__row">
						<span className="dialog__label">↔ Horizontal:</span>
						<input
							className="dialog__num"
							defaultValue={0}
						/>
					</div>
					<div className="dialog__row">
						<span className="dialog__label">↕ Vertical:</span>
						<input
							className="dialog__num"
							defaultValue={0}
						/>
					</div>
					<div className="dialog__hint">
						Giới hạn ±89° — tránh ma trận suy biến.
					</div>
				</div>
			</div>
		</Dialog>
	)
}
