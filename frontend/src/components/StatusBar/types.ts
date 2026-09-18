import type { ReactNode } from "react"

export interface StatusCellProps {
	icon: string
	children: ReactNode
}

export interface ZoomControlProps {
	zoom: number
	stepIndex: number
	maxIndex: number
	label: string
	onStep: (index: number) => void
	onZoomIn: () => void
	onZoomOut: () => void
}
