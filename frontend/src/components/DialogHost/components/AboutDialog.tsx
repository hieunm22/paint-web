import { Dialog } from "./Dialog"

export function AboutDialog() {
	return (
		<Dialog title="About Paint" width={360}>
			<div className="dialog__body">
				<div className="dialog__app-name">Paint Web 0.1.0</div>
				<p className="dialog__para">
					Bản dựng lại giao diện Ribbon của Microsoft Paint (Windows 10) trên
					nền web, chạy hoàn toàn client-side.
				</p>
				<p className="dialog__para dialog__para--muted">
					Không liên kết với Microsoft. Giao diện lấy cảm hứng từ Microsoft
					Paint. Icon dùng Font Awesome Pro theo license riêng; không sử dụng
					asset gốc của Paint.
				</p>
			</div>
		</Dialog>
	)
}
