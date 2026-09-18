import { Icon } from "components/Icon"
import { useAppDispatch } from "store"
import { openDialog } from "store/slices/uiSlice"
import { FILE_MENU_ROWS, RECENT_PICTURES } from "./constant"

export function FileMenuList() {
	const dispatch = useAppDispatch()

	return (
		<>
			{FILE_MENU_ROWS.map((row, i) =>
				row === "sep" ? (
					<div
						key={`sep-${i}`}
						className="file-menu__sep"
					/>
				) : (
					<button
						key={row.label}
						type="button"
						className="file-menu__item"
						title={row.note}
						onClick={() =>
							row.dialog ? dispatch(openDialog(row.dialog)) : undefined
						}
					>
						<span className="file-menu__item-icon">
							<Icon
								name={row.icon}
								size={17}
							/>
						</span>
						<span className="file-menu__item-label">{row.label}</span>
						{row.shortcut && (
							<span className="file-menu__item-shortcut">{row.shortcut}</span>
						)}
						{row.submenu && (
							<Icon
								name="caretDown"
								size={9}
							/>
						)}
					</button>
				),
			)}
		</>
	)
}

export function RecentPictureList() {
	return (
		<div className="file-menu__recent-list">
			{RECENT_PICTURES.map((pic) => (
				<button
					key={pic.name}
					type="button"
					className="file-menu__recent-item"
				>
					<span className="file-menu__thumb">
						<Icon
							name="thumbnail"
							size={18}
						/>
					</span>
					<span>
						<div className="file-menu__recent-name">{pic.name}</div>
						<div className="file-menu__recent-meta">
							{pic.location} · {pic.agoDays} ngày trước
						</div>
					</span>
				</button>
			))}
		</div>
	)
}
