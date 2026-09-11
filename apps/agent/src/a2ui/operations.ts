import { A2UI_OPERATIONS_KEY, A2UI_VERSION, ZEN_A2UI_CATALOG_ID } from './constants'

export type A2UIOperation = Record<string, unknown>

export function createSurface(
  surfaceId: string,
  catalogId: string = ZEN_A2UI_CATALOG_ID
): A2UIOperation {
  return {
    version: A2UI_VERSION,
    createSurface: { surfaceId, catalogId }
  }
}

export function updateComponents(surfaceId: string, components: unknown[]): A2UIOperation {
  return {
    version: A2UI_VERSION,
    updateComponents: { surfaceId, components }
  }
}

export function updateDataModel(surfaceId: string, value: unknown, path = '/'): A2UIOperation {
  return {
    version: A2UI_VERSION,
    updateDataModel: { surfaceId, path, value }
  }
}

export function deleteSurface(surfaceId: string): A2UIOperation {
  return {
    version: A2UI_VERSION,
    deleteSurface: { surfaceId }
  }
}

export function renderA2UI(operations: A2UIOperation[]): {
  [A2UI_OPERATIONS_KEY]: A2UIOperation[]
} {
  return {
    [A2UI_OPERATIONS_KEY]: operations
  }
}
