import type { ShapeKind } from "types/store.types"

export interface ShapeIconProps {
	kind: ShapeKind
	size?: number
}

export interface ShapePathProps {
	kind: ShapeKind
}
