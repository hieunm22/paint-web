import { LargeButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"

export function ExtrasGroup() {
	return (
		<RibbonGroup label="Extras">
			<LargeButton
				label="Copy to clipboard"
				icon="clipboard"
				title="Copy toàn ảnh hoặc vùng chọn ra clipboard hệ thống"
			/>
		</RibbonGroup>
	)
}
