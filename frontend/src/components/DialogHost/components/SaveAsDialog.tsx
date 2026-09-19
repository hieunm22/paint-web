import { useState } from "react"
import { FORMAT_HINTS, SAVE_FORMATS } from "../constant"
import { useAppSelector } from "store/hooks"
import type { ImageFormat } from "store/types"
import { Dialog } from "./Dialog"

/** fallback for browsers without the File System Access API. */
export function SaveAsDialog() {
	const fileName = useAppSelector((s) => s.doc.fileName)
	const [format, setFormat] = useState<ImageFormat>("png")
	const lossy = format === "jpeg" || format === "webp"

	return (
		<Dialog title="Save As" width={396}>
			<div className="dialog__body">
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">File name:</span>
					<input
						className="dialog__num dialog__num--wide"
						defaultValue={fileName}
					/>
				</div>
				<div className="dialog__row dialog__row--flush">
					<span className="dialog__label">Save as type:</span>
					<select
						className="dialog__select"
						value={format}
						onChange={(e) => setFormat(e.target.value as ImageFormat)}
					>
						{SAVE_FORMATS.map((f) => (
							<option key={f.id} value={f.id}>
								{f.label} ({f.ext})
							</option>
						))}
					</select>
				</div>
				{lossy && (
					<div className="dialog__row dialog__row--flush">
						<span className="dialog__label">Quality:</span>
						<input
							type="range"
							min={10}
							max={100}
							defaultValue={92}
							className="dialog__range"
						/>
					</div>
				)}
				<div className="dialog__hint dialog__hint--flush">
					{FORMAT_HINTS[format]}
				</div>
			</div>
		</Dialog>
	)
}
