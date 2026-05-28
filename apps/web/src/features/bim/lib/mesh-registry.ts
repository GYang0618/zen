import { getObjectId } from './object'

import type { Mesh, Object3D } from 'three'

const registry = new Map<string, Mesh>()

/** 非响应式 Mesh 索引，供拾取高亮与 AI 工具命令式查询 */
export const bimMeshRegistry = {
  get(id: string): Mesh | undefined {
    return registry.get(id)
  },

  getMeshes(ids: readonly string[]): Mesh[] {
    const meshes: Mesh[] = []
    for (const id of ids) {
      const mesh = registry.get(id)
      if (mesh) meshes.push(mesh)
    }
    return meshes
  },

  has(id: string): boolean {
    return registry.has(id)
  },

  /** 遍历子树注册所有 Mesh，返回卸载函数 */
  registerFromRoot(root: Object3D): () => void {
    const owned = new Map<string, Mesh>()

    root.traverse((object) => {
      if (!(object as Mesh).isMesh) return
      const mesh = object as Mesh
      const id = getObjectId(mesh)
      owned.set(id, mesh)
      registry.set(id, mesh)
    })

    return () => {
      for (const [id, mesh] of owned) {
        if (registry.get(id) === mesh) {
          registry.delete(id)
        }
      }
    }
  }
}
