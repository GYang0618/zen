# Text Effect

路径：`src/common/text-effect/`  
导入：

```tsx
import { GradientText, TypingText } from '@zen/ui'
```

均为客户端组件（含动画依赖）。

---

## GradientText

渐变色流动文字，适合欢迎语、空态标题等轻量装饰。

### 最小示例

```tsx
<GradientText text="有什么可以帮你的吗？" />
```

### 常用组合

```tsx
<GradientText
  text={`${user.nickname}，你好！`}
  className="text-2xl font-semibold"
  neon
/>
```

### Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `text` | `string` | 必填 | 展示文案 |
| `gradient` | `string` | 蓝→紫→粉循环渐变 | CSS `background-image` |
| `neon` | `boolean` | `false` | 轻微发光 |
| `transition` | Motion `Transition` | 3s 无限线性 | 流动动画参数 |
| 其余 | `span` 属性 | — | 透传 |

---

## TypingText

打字机效果，支持单句 / 多句循环。

### 最小示例

```tsx
<TypingText text="正在生成回答…" />
```

### 多句循环

```tsx
<TypingText
  text={['正在分析上下文…', '正在检索知识库…', '正在整理结论…']}
  loop
  typingSpeed={40}
  deletingSpeed={24}
  pauseDuration={1600}
/>
```

### 自定义渲染

```tsx
<TypingText
  text="Hello"
  showCursor
  render={(current) => <span className="font-mono text-primary">{current}</span>}
/>
```

### 常用 Props

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `text` | `string \| string[]` | 必填 | 单句或多句 |
| `as` | `ElementType` | `'div'` | 根元素标签 |
| `typingSpeed` / `deletingSpeed` | `number` | `50` / `30` | 打字 / 删除间隔（ms） |
| `loop` | `boolean` | `true` | 多句是否循环 |
| `showCursor` | `boolean` | `true` | 显示光标 |
| `startOnVisible` | `boolean` | `false` | 进入视口后再开始 |
| `render` | `(text: string) => ReactNode` | — | 自定义当前文本渲染 |

完整参数见源码：`src/common/text-effect/typing-text.tsx`。
