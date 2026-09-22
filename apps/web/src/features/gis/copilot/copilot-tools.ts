import { useGisRoamTool } from './tools/use-gis-roam-tool'
import { useSceneDeployTool } from './tools/use-scene-deploy-tool'

/** Cesium 场景内统一注册 GIS AI 前端工具 */
export function useCopilotTools() {
  useGisRoamTool()
  useSceneDeployTool()
}
