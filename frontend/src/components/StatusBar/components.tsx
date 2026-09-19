import { useTranslation } from "react-i18next"
import { Icon } from "components/Icon"
import type { StatusCellProps, ZoomControlProps } from "./types"

export function StatusCell({ icon, children }: StatusCellProps) {
	return (
		<span className="status-bar__cell">
			<span className="status-bar__cell-icon">
				<Icon name={icon} size={12} />
			</span>
			{children}
		</span>
	)
}

export function ZoomControl({
	stepIndex,
	maxIndex,
	label,
	onStep,
	onZoomIn,
	onZoomOut,
}: ZoomControlProps) {
	const { t } = useTranslation()

	return (
		<div className="status-bar__zoom">
			<button
				type="button"
				className="status-bar__zoom-btn"
				title={t("statusbar.zoom.out")}
				onClick={onZoomOut}
			>
				<Icon name="minus" size={9} />
			</button>
			<input
				className="status-bar__slider"
				type="range"
				min={0}
				max={maxIndex}
				step={1}
				value={stepIndex}
				aria-label={t("statusbar.zoom.label")}
				onChange={(e) => onStep(Number(e.target.value))}
			/>
			<button
				type="button"
				className="status-bar__zoom-btn"
				title={t("statusbar.zoom.in")}
				onClick={onZoomIn}
			>
				<Icon name="plus" size={9} />
			</button>
			<span className="status-bar__zoom-label">{label}</span>
		</div>
	)
}
