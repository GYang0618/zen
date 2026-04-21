/**
 * 可用字体名称列表（访问 `/settings/appearance` 页面）。
 * 该数组用于生成动态字体类（例如：`font-inter`、`font-manrope`）。
 *
 * 📝 如何添加新字体（Tailwind v4+）：
 * 1. 在这里添加字体名称。
 * 2. 更新 `index.html` 中的 `<link>` 标签，引入来自 Google Fonts（或其他来源）的新字体。
 * 3. 在 `index.css` 中通过 `@theme inline` 和 `font-family` CSS 变量添加新的字体族。
 *
 * 示例：
 * fonts.ts           → 在该数组中添加 'roboto'。
 * index.html         → 为 Roboto 添加 Google Fonts 链接。
 * index.css          → 在 CSS 中添加新字体，例如：
 *   @theme inline {
 *      // ... 其他字体族
 *      --font-roboto: 'Roboto', var(--font-sans);
 *   }
 */
export const fonts = ['inter', 'manrope', 'system'] as const
