/** libheif-js types its raw module only; this covers the decoder wrapper it exports. */
declare module "libheif-js" {
	export interface HeifPixels {
		data: Uint8ClampedArray
		width: number
		height: number
	}

	export interface HeifImage {
		get_width(): number
		get_height(): number
		is_primary(): boolean
		/** fills target with rgba pixels, or hands back null when decoding fails. */
		display(target: HeifPixels, done: (result: HeifPixels | null) => void): void
		free(): void
	}

	export class HeifDecoder {
		/** every top-level image in the file, empty when it cannot be parsed. */
		decode(bytes: Uint8Array): HeifImage[]
	}

	const libheif: { HeifDecoder: typeof HeifDecoder }
	export default libheif
}
