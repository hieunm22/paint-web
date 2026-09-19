import { Icon } from "components/Icon"
import { QAT_ITEMS, WINDOW_BUTTONS } from "./constant"

export function QuickAccessToolbar() {
	return (
		<div className="title-bar__qat">
			{QAT_ITEMS.map((item) => (
				<button
					key={item.id}
					type="button"
					className="title-bar__qat-btn"
					title={item.title}
					disabled={item.disabled}
				>
					<Icon name={item.icon} size={14} />
				</button>
			))}
			<button
				type="button"
				className="title-bar__qat-btn title-bar__qat-btn--caret"
				title="Customise Quick Access Toolbar"
			>
				<Icon name="caretDown" size={9} />
			</button>
		</div>
	)
}

export function WindowButtons() {
	return (
		<div className="title-bar__window-btns">
			{WINDOW_BUTTONS.map((btn) => (
				<button
					key={btn.id}
					type="button"
					className={`title-bar__window-btn title-bar__window-btn--${btn.id}`}
					title={btn.title}
					disabled={btn.disabled}
				>
					<Icon name={btn.icon} size={btn.size} />
				</button>
			))}
		</div>
	)
}
