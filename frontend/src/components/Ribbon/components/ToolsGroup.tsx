import { IconButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { useAppDispatch, useAppSelector } from "store"
import { setTool } from "store/slices/toolSlice"
import { TOOLS } from "../constant"

/** 3x2 tool grid. */
export function ToolsGroup() {
	const dispatch = useAppDispatch()
	const active = useAppSelector((s) => s.tool.active)

	return (
		<RibbonGroup label="Tools">
			<div className="tools-grid">
				{TOOLS.map((tool) => (
					<IconButton
						key={tool.id}
						label={tool.label}
						icon={tool.icon}
						selected={active === tool.id}
						onClick={() => dispatch(setTool(tool.id))}
					/>
				))}
			</div>
		</RibbonGroup>
	)
}
