import { Icon } from "components/Icon"
import { FileMenuList, RecentPictureList } from "./components"
import { useAppDispatch } from "store/hooks"
import { closeBackstage } from "store/slices/uiSlice"
import "./FileMenu.scss"

/** blue backstage panel for the File tab, covering ribbon and canvas. */
export function FileMenu() {
	const dispatch = useAppDispatch()

	return (
		<div className="file-menu" role="menu" aria-label="File">
			<div className="file-menu__left">
				<button
					type="button"
					className="file-menu__back"
					onClick={() => dispatch(closeBackstage())}
				>
					<Icon name="caretDown" size={12} />
					Back
				</button>
				<FileMenuList />
			</div>

			<div className="file-menu__right">
				<div className="file-menu__right-title">Recent pictures</div>
				<RecentPictureList />
			</div>
		</div>
	)
}
