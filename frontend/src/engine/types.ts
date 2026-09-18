export interface Size {
	width: number
	height: number
}

/** the three stacked canvases one Surface drives. */
export interface SurfaceLayers {
	base: HTMLCanvasElement
	preview: HTMLCanvasElement
	overlay: HTMLCanvasElement
}

export interface SurfaceContexts {
	base: CanvasRenderingContext2D
	preview: CanvasRenderingContext2D
	overlay: CanvasRenderingContext2D
}
