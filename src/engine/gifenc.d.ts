/** gifenc ships no types; this covers the single-frame subset the encoder uses. */
declare module "gifenc" {
	export type GifColorFormat = "rgb565" | "rgb444" | "rgba4444"

	/** one entry per color, either [r, g, b] or [r, g, b, a]. */
	export type GifPalette = number[][]

	export interface QuantizeOptions {
		format?: GifColorFormat
		oneBitAlpha?: boolean | number
	}

	export interface FrameOptions {
		palette?: GifPalette
		transparent?: boolean
		transparentIndex?: number
	}

	export interface EncoderOptions {
		initialCapacity?: number
		auto?: boolean
	}

	export interface GifStream {
		writeFrame(
			index: Uint8Array,
			width: number,
			height: number,
			options?: FrameOptions,
		): void
		finish(): void
		bytes(): Uint8Array
	}

	export function quantize(
		rgba: Uint8Array | Uint8ClampedArray,
		maxColors: number,
		options?: QuantizeOptions,
	): GifPalette

	export function applyPalette(
		rgba: Uint8Array | Uint8ClampedArray,
		palette: GifPalette,
		format?: GifColorFormat,
	): Uint8Array

	export function GIFEncoder(options?: EncoderOptions): GifStream
}
