import { useTranslation } from "react-i18next"
import { TOOLS } from "../constant"
import { IconButton } from "components/RibbonButton"
import { RibbonGroup } from "components/RibbonGroup"
import { TOOLS as IMPLEMENTED } from "engine/tools/registry"
import { useAppDispatch, useAppSelector } from "store/hooks"
import { setTool } from "store/slices/toolSlice"

/** 3x2 tool grid. a tool with no entry in the engine registry stays disabled. */
export function ToolsGroup() {
	const { t } = useTranslation()
	const dispatch = useAppDispatch()
	const active = useAppSelector(s => s.tool.active)

	return (
		<RibbonGroup label={t("ribbon.tools.label")}>
			<div className="tools-grid">
				{TOOLS.map(tool => (
					<IconButton
						key={tool.id}
						label={t(tool.labelKey)}
						icon={tool.icon}
						selected={active === tool.id}
						disabled={!IMPLEMENTED[tool.id]}
						onClick={() => dispatch(setTool(tool.id))}
					/>
				))}
			</div>
		</RibbonGroup>
	)
}
