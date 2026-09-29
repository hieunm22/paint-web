import classnames from "classnames"
import { useTranslation } from "react-i18next"
import { WINDOW_BUTTONS } from "./constant"
import { Icon } from "components/Icon"
import Menu from "components/Menu"
import {
	MenuAnchor,
	MenuItem,
	MenuSectionLabel,
} from "components/Menu/components"
import { toggleFullscreen } from "common/dom"
import { useFileCommands } from "hooks/useFileCommands"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { useQatItems, useQatPersistence } from "./hooks"
import { toggleMenu, toggleQat } from "store/slices/uiSlice"
import { EmptyVoid } from "types/common.types"
import type { WindowButtonId } from "./types"

const QAT_MENU_WIDTH = 236

export function QuickAccessToolbar() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const items = useQatItems()
	const shown = useAppSelector(s => s.ui.qat)
	const open = useAppSelector(s => s.ui.openMenu) === "qat"
	useQatPersistence(shown)

	return (
		<div className="title-bar__qat" data-keytip-layer="root">
			{items
				.filter(item => shown.includes(item.id))
				.map((item, i) => {
					// Paint numbers the bar from the left
					const keyTip = String(i + 1)

					return (
						<button
							key={item.id}
							type="button"
							className="title-bar__qat-btn"
							title={item.title}
							disabled={item.disabled}
							data-keytip={keyTip}
							onClick={item.onClick}
						>
							<Icon name={item.icon} size={14} />
						</button>
					)
				})}
			<MenuAnchor>
				<button
					type="button"
					className="title-bar__qat-btn title-bar__qat-btn--caret"
					title={t("titlebar.qat.customize")}
					aria-expanded={open}
					onClick={() => dispatch(toggleMenu("qat"))}
				>
					<Icon name="caretDown" size={9} />
				</button>
				{open && (
					<Menu width={QAT_MENU_WIDTH} sticky>
						<MenuSectionLabel>{t("titlebar.qat.customize")}</MenuSectionLabel>
						{items.map(item => (
							<MenuItem
								key={item.id}
								label={t(item.labelKey)}
								icon={item.icon}
								checked={shown.includes(item.id)}
								onClick={() => dispatch(toggleQat(item.id))}
							/>
						))}
					</Menu>
				)}
			</MenuAnchor>
		</div>
	)
}

export function WindowButtons() {
	const { t } = useTranslation()
	const files = useFileCommands()

	// minimize has no web equivalent; maximize is the tab going full screen
	const handlers: Record<WindowButtonId, (EmptyVoid) | undefined> = {
		minimize: undefined,
		maximize: toggleFullscreen,
		close: () => files.exit(),
	}

	return (
		<div className="title-bar__window-btns">
			{WINDOW_BUTTONS.map(btn => {
				const cls = classnames(
					"title-bar__window-btn",
					`title-bar__window-btn--${btn.id}`,
				)

				return (
					<button
						key={btn.id}
						type="button"
						className={cls}
						title={t(btn.titleKey)}
						disabled={btn.disabled}
						onClick={handlers[btn.id]}
					>
						<Icon name={btn.icon} size={btn.size} />
					</button>
				)
			})}
		</div>
	)
}
