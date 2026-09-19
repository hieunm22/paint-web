import { useTranslation } from "react-i18next"
import { WINDOW_BUTTONS } from "./constant"
import { Icon } from "components/Icon"
import { useFileCommands } from "hooks/useFileCommands"
import { useQatItems } from "./hooks"

export function QuickAccessToolbar() {
	const { t } = useTranslation()
	const items = useQatItems()

	return (
		<div className="title-bar__qat">
			{items.map((item) => (
				<button
					key={item.id}
					type="button"
					className="title-bar__qat-btn"
					title={item.title}
					disabled={item.disabled}
					onClick={item.onClick}
				>
					<Icon name={item.icon} size={14} />
				</button>
			))}
			<button
				type="button"
				className="title-bar__qat-btn title-bar__qat-btn--caret"
				title={t("titlebar.qat.customise")}
			>
				<Icon name="caretDown" size={9} />
			</button>
		</div>
	)
}

export function WindowButtons() {
	const { t } = useTranslation()
	const files = useFileCommands()

	return (
		<div className="title-bar__window-btns">
			{WINDOW_BUTTONS.map((btn) => (
				<button
					key={btn.id}
					type="button"
					className={`title-bar__window-btn title-bar__window-btn--${btn.id}`}
					title={t(btn.titleKey)}
					disabled={btn.disabled}
					onClick={btn.id === "close" ? () => files.exit() : undefined}
				>
					<Icon name={btn.icon} size={btn.size} />
				</button>
			))}
		</div>
	)
}
