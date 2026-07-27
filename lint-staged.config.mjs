/** @type {import('lint-staged').Configuration} */
export default {
  // Biome 官方推荐：对暂存文件做 format + lint + safe fix
  '*': 'biome check --write --no-errors-on-unmatched --files-ignore-unknown=true',
  // 有 TS 变更时跑一次全仓类型检查（函数形式避免按文件重复执行）
  '**/*.{ts,tsx}': () => 'pnpm check-types'
}
