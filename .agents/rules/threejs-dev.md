---
trigger: always_on
---

# React Three Fiber 开发规范

适用范围：基于 React 19 + TypeScript 的 3D / WebGL 场景开发。优先使用 React Three Fiber (R3F) 声明式范式，禁止在 React 应用中直接以命令式风格散落 `THREE.*` 代码。

## 1. 技术栈与版本约束

- **核心渲染器**: `three` (>= r160) + `@react-three/fiber` (v9，对齐 React 19)
- **生态扩展**:
  - `@react-three/drei`：通用 helpers / abstractions（相机控制、加载、材质、文本等）
  - `@react-three/rapier`：物理引擎（替代旧的 cannon-es 方案）
  - `@react-three/postprocessing`：后期处理管线
  - `@react-three/xr`：WebXR / VR / AR
  - `leva`：开发期调试面板（仅 dev，禁止打入生产关键路径）
- **加载器与资源**:
  - 模型统一使用 **glTF 2.0 (.glb)**，禁止使用 FBX/OBJ 作为生产资产
  - 通过 `gltfjsx` 预生成强类型组件（`useGLTF` + `JSX.IntrinsicElements`）
  - 大型贴图统一使用 **KTX2 (Basis Universal)**，通过 `useKTX2` 加载
  - Draco / Meshopt 压缩需在构建期完成，运行时仅做解码
- **状态管理**: 跨组件的 3D 状态使用 **Zustand**（避免 Context 引发的全树重渲染），瞬时状态使用 ref / `useFrame` 内部 mutate
- **类型**: `@types/three` 必须与 `three` 主版本严格对齐

## 2. 项目结构

按特性划分，3D 模块与 UI 解耦：

```
features/<domain>/
├── components/        # R3F 组件（场景、模型、灯光、控件）
├── hooks/             # use-xxx 自定义 hook（如 use-model、use-raycaster）
├── stores/            # zustand store（场景/选中态/相机态）
├── lib/               # 纯函数工具（向量计算、几何/材质构建器）
├── shaders/           # *.vert / *.frag / *.glsl
├── prompts/ | types/  # 类型与常量
└── index.tsx          # 对外入口（Canvas 容器组件）
```

约束：
- `Canvas` 容器组件不直接持有业务逻辑，仅做装配
- 业务逻辑（数据获取、权限、AI 工具）写在 React DOM 层，3D 层通过 props / store 接收

## 3. Canvas 与渲染配置

```tsx
<Canvas
  shadows
  dpr={[1, 2]}
  gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
  camera={{ position: [0, 2, 5], fov: 50, near: 0.1, far: 1000 }}
  frameloop="demand" // 静态场景必须使用 demand，节省 GPU
>
  <Suspense fallback={<Loader />}>
    <Scene />
  </Suspense>
</Canvas>
```

规范：
- `dpr` 必须设置上限（建议 `[1, 2]`），禁止裸用 `window.devicePixelRatio`
- 静态/低频更新场景使用 `frameloop="demand"`，配合 `invalidate()` 主动刷新
- 颜色空间统一使用 sRGB（R3F v9 默认 `THREE.SRGBColorSpace`，材质贴图按需声明）
- 物理正确光照启用：`gl={{ ...}} flat={false}` 默认即可；如启用 ACES，使用 `<ToneMapping />` 而非手动设置

## 4. 声明式组件规范

- **绝对禁止**在 R3F 组件树之外手动 `new THREE.Scene()` 或 `renderer.render()`
- 使用 JSX 内置元素：`<mesh>`、`<group>`、`<directionalLight>`、`<meshStandardMaterial>` 等，遵循 three.js 类名小驼峰
- 命令式操作通过 `ref` + `useFrame` 完成，避免 `setState` 高频触发渲染：

```tsx
const ref = useRef<THREE.Mesh>(null);
useFrame((_, delta) => {
  if (!ref.current) return;
  ref.current.rotation.y += delta;
});
```

- `useFrame` 内禁止：分配新对象（`new Vector3()`）、读写 React state、触发副作用。预分配临时变量在闭包外。
- 事件系统使用 R3F 内置：`onClick`、`onPointerOver`、`onPointerMissed`，不要手写 raycaster，除非批量自定义

## 5. drei 使用约定

优先使用 drei 提供的封装，减少重复造轮子：

| 场景 | 推荐 API |
|------|----------|
| 相机控制 | `<OrbitControls>` / `<CameraControls>`（更现代） |
| 资源加载 | `useGLTF`、`useTexture`、`useKTX2`、`useAnimations` |
| 环境光照 | `<Environment preset="city" />` / HDRI |
| 阴影/接触 | `<ContactShadows>`、`<AccumulativeShadows>` |
| 性能监视 | `<Stats>`、`<Perf>`（`r3f-perf`） |
| 文本 | `<Text>`（SDF）、`<Html>`（DOM 叠加） |
| 加载态 | `<Loader>` + `<Suspense>` |
| 工具辅助 | `<Grid>`、`<Gizmo*>`、`<TransformControls>` |
| 实例化 | `<Instances>` / `<Merged>`（大量相同 mesh 强制使用） |

约束：
- `useGLTF.preload('/models/x.glb')` 必须在路由级或入口预声明，避免懒加载抖动
- `<Html>` 仅用于必要的 DOM 叠加（标签/弹窗），不要承载复杂业务 UI

## 6. 性能规范

- **几何体/材质复用**：相同几何体提取到模块作用域常量（`const geo = new THREE.BoxGeometry()`），或使用 drei `<Instances>`
- **批渲染**：> 50 个相同对象必须使用 `InstancedMesh` / `<Instances>`，禁止 N 个 `<mesh>`
- **LOD**：远景物体使用 `<Lod>` 或自定义距离切换
- **裁剪**：开启 `frustumCulled`（默认开启，谨慎关闭）；大场景考虑 `BVH`（`three-mesh-bvh`）加速 raycast
- **阴影**：`shadow-mapSize` 控制在 `[1024, 2048]`；移动端关闭或使用 `<ContactShadows>` 替代
- **纹理**：
  - 贴图尺寸 2 的幂次，最大边长 ≤ 2048（UI/角色），背景 HDRI ≤ 4096
  - 必须设置 `texture.anisotropy = gl.capabilities.getMaxAnisotropy()`（drei loader 自动处理）
  - 颜色贴图标记 `SRGBColorSpace`，法线/数据贴图保持 `NoColorSpace`/`LinearSRGBColorSpace`
- **后期处理**：使用 `@react-three/postprocessing`（基于 pmndrs `postprocessing` 库，性能优于 three 自带 `EffectComposer`）
- **dispose**：R3F 自动释放卸载节点的 GPU 资源；手动 `new` 出的几何体/材质/纹理必须在 `useEffect` cleanup 中 `.dispose()`

## 7. 状态与数据流

- 跨组件共享的 3D 状态（选中对象、相机目标、模式切换）→ `zustand` store
- 高频每帧变化（位置、旋转、动画进度）→ ref + `useFrame`，**不进 store**
- React DOM 层与 3D 层通信：
  - DOM → 3D：通过 props 或 store 订阅
  - 3D → DOM：通过 store 派发，或 `onPointerXxx` 回调上抛
- 选中/Hover 等交互态使用 store 集中管理，避免 prop drilling

## 8. 着色器与自定义材质

- 自定义 shader 优先使用 `shaderMaterial` (drei) 工厂创建，自动获得 React 属性绑定
- GLSL 文件单独存放在 `shaders/`，通过 `vite-plugin-glsl` 或 `?raw` 导入
- uniform 命名 `uXxx`（如 `uTime`、`uColor`），attribute 命名 `aXxx`
- 复杂效果优先考虑 MeshPhysicalMaterial + onBeforeCompile 注入，而非完全自写 PBR

## 9. 动画

- 模型自带动画：`useAnimations(gltf.animations, ref)`，通过 action `.fadeIn/.fadeOut` 过渡
- 程序化动画：
  - 简单插值 → `useFrame` + `MathUtils.damp`
  - 复杂时间轴 → `@react-spring/three` 或 `framer-motion-3d`
  - 物理驱动 → `@react-three/rapier`
- 禁止使用 `setInterval` 驱动动画，必须走渲染循环

## 10. 可访问性与降级

- WebGL 不可用时提供降级 UI（检测 `WebGLRenderingContext`），不要直接白屏
- 关键交互必须有键盘等效路径或 DOM 镜像
- `<Canvas>` 添加 `aria-label` 或同级隐藏文本描述场景内容
- 提供 "降低画质" 开关（影响 dpr / shadow / postprocess）

## 11. 测试与调试

- 单元测试：纯函数（向量/矩阵计算）使用 Vitest 覆盖；R3F 组件可用 `@react-three/test-renderer`
- E2E：Playwright 截图比对 + WebGL 上下文校验
- 开发期调试：`leva` 控制参数、`r3f-perf` 监控 drawcall / FPS / 显存
- 生产构建移除所有 `<Stats>`、`<Perf>`、`leva` 控件，使用环境变量门控

## 12. 禁止行为

- 禁止在 R3F 组件树中直接 `useThree().scene.add(...)` 命令式插入对象
- 禁止在 `useFrame` 中调用 `setState` 或触发 React 重渲染
- 禁止裸用 `THREE.TextureLoader().load(...)`，必须走 `useTexture` / `useLoader` 以参与 Suspense
- 禁止把 three 对象（Vector3 / Object3D）放入 React state 或 zustand store
- 禁止未压缩 glTF / 未生成 mipmap 的大贴图进入生产构建
- 禁止在没有 `<Suspense>` 边界的情况下使用 `use*` 资源 hook