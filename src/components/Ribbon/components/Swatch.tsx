import classnames from "classnames"
import type { MouseEvent } from "react"
import { useAppDispatch } from "store/hooks"
import { applyColor, applySecondaryColor } from "store/slices/colorsSlice"
import { openDialog } from "store/slices/uiSlice"
import type { SwatchProps } from "../types"

/**
 * one color of the palette. the left button fills whichever slot is being
 * edited, the right button always fills color 2 and moves the edit onto it.
 */
export function Swatch({ hex, label }: SwatchProps) {
	const dispatch = useAppDispatch()
	const cls = classnames("colors__swatch", {
		"colors__swatch--empty": !hex,
	})

	// an empty custom slot has no color to give, and offers the dialog instead
	const onPick = () => {
		if (!hex) {
			dispatch(openDialog("edit-colors"))
			return
		}
		dispatch(applyColor(hex))
	}

	const onSecondary = (e: MouseEvent<HTMLButtonElement>) => {
		// the browser menu would cover the palette the click just used
		e.preventDefault()
		if (hex) dispatch(applySecondaryColor(hex))
	}

	return (
		<button
			type="button"
			className={cls}
			style={hex ? { background: hex } : undefined}
			title={label}
			aria-label={label}
			onClick={onPick}
			onContextMenu={onSecondary}
		/>
	)
}
