/** pixel data starts right after the two headers, 14 + 40 bytes. */
const HEADER = 54

/** every row is padded out to a multiple of four bytes. */
function rowStride(width: number): number {
	return (width * 3 + 3) & ~3
}

/**
 * 24-bit uncompressed BMP, the one raster format no browser will encode.
 * there is no alpha channel here: the caller flattens onto paper first.
 */
export function encodeBmp24(image: ImageData): Blob {
	const { width, height, data } = image
	const stride = rowStride(width)
	const pixels = stride * height
	const buffer = new ArrayBuffer(HEADER + pixels)
	const view = new DataView(buffer)

	// BITMAPFILEHEADER
	view.setUint16(0, 0x4d42, true)
	view.setUint32(2, HEADER + pixels, true)
	view.setUint32(10, HEADER, true)

	// BITMAPINFOHEADER. a positive height means the rows run bottom-up
	view.setUint32(14, 40, true)
	view.setInt32(18, width, true)
	view.setInt32(22, height, true)
	view.setUint16(26, 1, true)
	view.setUint16(28, 24, true)
	view.setUint32(34, pixels, true)

	const out = new Uint8Array(buffer, HEADER)
	for (let y = 0; y < height; y++) {
		const src = (height - 1 - y) * width * 4
		let dst = y * stride
		for (let x = 0; x < width; x++) {
			const i = src + x * 4
			out[dst++] = data[i + 2]
			out[dst++] = data[i + 1]
			out[dst++] = data[i]
		}
	}

	return new Blob([buffer], { type: "image/bmp" })
}
