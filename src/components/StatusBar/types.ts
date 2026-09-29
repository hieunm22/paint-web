import type { ReactNode } from "react"
import { EmptyVoid } from "types/common.types"
import type { IconName } from "components/Icon/types"

export interface StatusCellProps {
	icon: IconName
	children: ReactNode
}

export interface ZoomControlProps {
	zoom: number
	stepIndex: number
	maxIndex: number
	label: string
	onStep: (index: number) => void
	onZoomIn: EmptyVoid
	onZoomOut: EmptyVoid
}
