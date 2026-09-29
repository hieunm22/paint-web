import { createPortal } from "react-dom"
import classnames from "classnames"
import { useKeyTips } from "./hooks"
import "./KeyTips.scss"

/**
 * the letters Alt shows over the ribbon, the tab strip and any open menu.
 */
export function KeyTips() {
	const tips = useKeyTips()
	if (!tips.length) return null

	return createPortal(
		<div className="key-tips" aria-hidden>
			{tips.map(tip => {
				const cls = classnames("key-tips__tip", {
					"key-tips__tip--disabled": tip.disabled,
				})

				return (
					<span
						key={tip.keys}
						className={cls}
						style={{ left: tip.left, top: tip.top }}
					>
						{tip.keys}
					</span>
				)
			})}
		</div>,
		document.body,
	)
}
