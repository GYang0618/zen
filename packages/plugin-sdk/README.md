# @zen/plugin-sdk

编译期插件 SDK：Manifest 契约、发现与校验、贡献点 Registry、注册表生成。

## 命令

```bash
# 校验 plugins/*
pnpm run plugin:validate

# 生成 packages/plugin-sdk/src/generated/plugin-registry.gen.ts
pnpm run plugin:generate
```

或在本包内（需先 `pnpm build`）：

```bash
pnpm -F @zen/plugin-sdk validate
pnpm -F @zen/plugin-sdk generate
```

## 宿主用法

```ts
import { PLUGIN_REGISTRY, ContributionRegistry, filterActiveRegistryEntries } from '@zen/plugin-sdk'
```

停用插件后使用 `filterActiveRegistryEntries` / `ContributionRegistry.setStatus` 隐藏贡献点。

详见 [docs/architecture/plugin-system.md](../../docs/architecture/plugin-system.md)。
