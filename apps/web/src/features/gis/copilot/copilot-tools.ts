import { useSceneModelCatalogGenerativeUI } from './generative-ui/use-scene-model-catalog-generative-ui'
import { useGisLocateTool } from './tools/use-gis-locate-tool'
import { useGisRoamControlTool } from './tools/use-gis-roam-control-tool'
import { useGisRoamTool } from './tools/use-gis-roam-tool'
import { useModelAnalysisTools } from './tools/use-model-analysis-tools'
import { useSceneDeployTool } from './tools/use-scene-deploy-tool'

/** Cesium 场景内统一注册 GIS AI 前端工具 */
export function useCopilotTools() {
  useGisLocateTool()
  useGisRoamTool()
  useGisRoamControlTool()
  useModelAnalysisTools()
  useSceneDeployTool()
  useSceneModelCatalogGenerativeUI()
}
