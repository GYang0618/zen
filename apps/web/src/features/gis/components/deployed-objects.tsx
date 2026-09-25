import { Cesium3DTileset } from 'cesium'
import { useEffect, useRef } from 'react'

import { useCesium } from '../cesium-provider'
import { GIS_DEPLOY_LOD } from '../constants'
import {
  buildDeployTileset,
  createTilesetBlobUrl,
  GIS_DEPLOY_TILESET_REVISION
} from '../lib/build-deploy-tileset'
import { useGisStore } from '../stores/gis'

import type { Viewer } from 'cesium'
import type { GisDeployedObject } from '../stores/gis'

type CellTileset = {
  tileset: Cesium3DTileset
  url: string
  signature: string
}

export function DeployedObjects() {
  const { viewer } = useCesium()
  const deployedObjects = useGisStore((state) => state.deployedObjects)
  const cellsRef = useRef<Map<string, CellTileset>>(new Map())
  const generationRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const cells = cellsRef.current
    const generations = generationRef.current
    let active = true

    void syncDeployCells(viewer, cells, generations, groupByCell(deployedObjects), () => active)

    return () => {
      active = false
    }
  }, [viewer, deployedObjects])

  useEffect(() => {
    const cells = cellsRef.current
    return () => {
      releaseCells(viewer, cells)
    }
  }, [viewer])

  return null
}

function groupByCell(objects: GisDeployedObject[]): Map<string, GisDeployedObject[]> {
  const groups = new Map<string, GisDeployedObject[]>()
  for (const object of objects) {
    const list = groups.get(object.cellId) ?? []
    list.push(object)
    groups.set(object.cellId, list)
  }
  return groups
}

async function syncDeployCells(
  viewer: Viewer,
  cells: Map<string, CellTileset>,
  generations: Map<string, number>,
  groups: Map<string, GisDeployedObject[]>,
  isActive: () => boolean
): Promise<void> {
  dropRemovedCells(viewer, cells, groups)
  await Promise.all(
    [...groups.entries()].map(([cellId, objects]) =>
      upsertCell(viewer, cells, generations, cellId, objects, isActive)
    )
  )
}

function dropRemovedCells(
  viewer: Viewer,
  cells: Map<string, CellTileset>,
  groups: Map<string, GisDeployedObject[]>
): void {
  for (const [cellId, entry] of cells.entries()) {
    if (groups.has(cellId)) continue
    removeCell(viewer, entry)
    cells.delete(cellId)
  }
}

async function upsertCell(
  viewer: Viewer,
  cells: Map<string, CellTileset>,
  generations: Map<string, number>,
  cellId: string,
  objects: GisDeployedObject[],
  isActive: () => boolean
): Promise<void> {
  const signature = `${GIS_DEPLOY_TILESET_REVISION}:${objects.map((object) => object.id).join('|')}`
  if (cells.get(cellId)?.signature === signature) return

  const token = (generations.get(cellId) ?? 0) + 1
  generations.set(cellId, token)
  const url = createTilesetBlobUrl(buildDeployTileset(objects))

  try {
    const tileset = await Cesium3DTileset.fromUrl(url, {
      maximumScreenSpaceError: GIS_DEPLOY_LOD.maximumScreenSpaceError
    })
    if (!isActive() || generations.get(cellId) !== token || viewer.isDestroyed()) {
      viewer.scene.primitives.remove(tileset)
      URL.revokeObjectURL(url)
      return
    }
    const previous = cells.get(cellId)
    if (previous) removeCell(viewer, previous)
    viewer.scene.primitives.add(tileset)
    cells.set(cellId, { tileset, url, signature })
  } catch (error) {
    URL.revokeObjectURL(url)
    console.error(`[GIS] 部署格子 ${cellId} 的 3D Tiles 加载失败`, error)
  }
}

function removeCell(viewer: Viewer, entry: CellTileset): void {
  if (!viewer.isDestroyed()) {
    viewer.scene.primitives.remove(entry.tileset)
  }
  URL.revokeObjectURL(entry.url)
}

function releaseCells(viewer: Viewer, cells: Map<string, CellTileset>): void {
  for (const entry of cells.values()) {
    removeCell(viewer, entry)
  }
  cells.clear()
}
