/** Tileset 构件选中上限（Outline 后处理） */
export const MAX_TILESET_SELECTION = 200

export const DRAG_THRESHOLD_PX = 5

/**
 * 3D Tiles 屏幕空间误差阈值（SSE）。默认 16，值越大同屏加载的瓦片越少
 * （性能↑ / 细节↓）。海量构件场景适当调高以控制 drawcall 与三角面，按实测平衡画质。
 */
export const TILESET_ERROR_TARGET = 24

/** LRU 缓存内存预算（字节）：控制驻留瓦片的显存 / 内存上限，避免 10w 构件全量留驻 */
export const TILESET_CACHE_MIN_BYTES = 384 * 1024 * 1024
export const TILESET_CACHE_MAX_BYTES = 768 * 1024 * 1024
