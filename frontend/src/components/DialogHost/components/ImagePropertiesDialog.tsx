import { useAppSelector } from "store/hooks"
import { Dialog } from "./Dialog"

/** image properties dialog (Ctrl+E). */
export function ImagePropertiesDialog() {
	const doc = useAppSelector((s) => s.doc)
	const sizeKB = Math.round((doc.width * doc.height * 3) / 1024)

	return (
		<Dialog title="Image Properties" width={332}>
			<div className="dialog__body">
				<div className="dialog__group">
					<div className="dialog__group-title">File Attributes</div>
					<div className="dialog__kv">
						<span>Last saved:</span>
						<span>Not available</span>
						<span>Size on disk:</span>
						<span>{sizeKB} KB (ước tính)</span>
						<span>Resolution:</span>
						<span>{doc.dpi} DPI</span>
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">Units</div>
					<div className="dialog__row dialog__row--flush">
						<label>
							<input type="radio" name="units" /> Inches
						</label>
						<label>
							<input type="radio" name="units" /> Centimeters
						</label>
						<label>
							<input type="radio" name="units" defaultChecked /> Pixels
						</label>
					</div>
				</div>

				<div className="dialog__group">
					<div className="dialog__group-title">Colors</div>
					<div className="dialog__row dialog__row--flush">
						<label>
							<input type="radio" name="colors" /> Black and white
						</label>
						<label>
							<input type="radio" name="colors" defaultChecked /> Color
						</label>
					</div>
				</div>

				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">Width:</span>
					<input className="dialog__num" defaultValue={doc.width} />
					<span className="dialog__label dialog__label--short">Height:</span>
					<input className="dialog__num" defaultValue={doc.height} />
				</div>
			</div>
		</Dialog>
	)
}
