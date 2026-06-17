# Luv(sic) Notes — 个人博客

一个安静的双主题静态博客。Markdown 写作，KaTeX 渲染，无需构建。

[English version](README.en.md)

## 项目结构

```
luvsic-blog/
├── index.html              # 首页 — 主视觉 + 分类筛选 + 文章网格
├── post.html               # 文章页（通过 ?slug= 读取 URL）
├── about.html              # 关于页面
│
├── config.json             # ← 站点配置（标题、导航、分类）
│
├── posts/
│   ├── index.json          # ← 文章注册表（所有文章的元数据）
│   ├── margins-for-memory.md
│   ├── on-quiet-proofs.md
│   ├── notebook-after-midnight.md
│   ├── a-syntax-for-rain.md
│   ├── half-remembered-proof.md
│   └── listening-to-nujabes.md
│
├── assets/
│   ├── styles.css          # 共享样式（双主题 + 毛玻璃效果）
│   └── app.js              # 共享脚本（主题、Markdown、顶栏、页脚）
│
└── README.md
```

## 本地运行

前端通过 `fetch()` 加载 `config.json`、`posts/index.json` 和 Markdown 文件，因此**必须通过 HTTP 协议访问**——直接使用 `file://` 协议打开会因为跨域限制而失败。

任意静态服务器均可：

```bash
# Python（内置）
cd luvsic-blog
python3 -m http.server 8000
# → 浏览器打开 http://localhost:8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

## 部署

这是一个纯静态站点，把文件夹放到下面任意平台即可：

- **GitHub Pages** — 推送到仓库，在设置中启用 Pages
- **Cloudflare Pages** — 连接仓库，构建命令留空，输出目录 `/`
- **Vercel / Netlify** — 拖拽文件夹即可
- **任意静态托管 / S3 / nginx** — 直接托管文件

无需构建步骤，无 Node 运行时依赖。

## 添加新文章

1. **编写 Markdown。** 将 `.md` 文件放入 `posts/` 目录。使用 frontmatter 以兼容 Obsidian：

   ```markdown
   ---
   title: 我的新笔记
   date: 2026-05-01
   category: essay
   tags: [memory, draft]
   ---

   正文内容从这里开始…
   ```

2. **注册文章** 到 `posts/index.json`。在 `posts` 数组中添加一条记录：

   ```json
   {
     "slug": "my-new-note",
     "file": "my-new-note.md",
     "title": "我的新笔记",
     "date": "2026-05-01",
     "category": "essay",
     "tags": ["memory", "draft"],
     "excerpt": "文章卡片上显示的摘要。",
     "readingTime": 5,
     "featuredFormula": "e^{i\\pi} + 1 = 0"
   }
   ```

   字段说明：
   - `slug`（必填）— URL 路径，用于 `post.html?slug=…`
   - `file`（必填）— `posts/` 目录下的文件名
   - `category`（必填）— 必须匹配 `config.json → categories` 中的某个 id
   - `excerpt` — 文章卡片上显示的摘要
   - `featuredFormula` — 卡片中展示的 KaTeX 公式（可选）
   - `readingTime` — 预计阅读时间（整数分钟）
   - `tags` — 标签数组

3. **刷新页面。** 无需构建，即刻生效。

## 管理分类

分类在 `config.json` 中统一定义：

```json
"categories": [
  { "id": "essay", "name": "Essay", "description": "…", "accent": "accent" },
  { "id": "code",  "name": "Code",  "description": "…", "accent": "amber"  }
]
```

- `id` — 简短的小写标识符，文章通过 `category` 字段引用它
- `name` — 分类筛选栏中显示的名称
- `accent` — 颜色主题，可选 `"accent"`（蓝灰/橙色）或 `"amber"`（暖琥珀色）

首页的分类筛选栏会根据此列表自动生成，并显示每个分类下的文章数。

## 支持的 Markdown 特性

| 特性                   | 语法                                           |
| ---------------------- | ---------------------------------------------- |
| 行内公式               | `$E = mc^2$`                                   |
| 块级公式               | `$$ \int_a^b f(x)\,dx $$`                      |
| 带复制按钮的代码块     | ` ```javascript … ``` `                        |
| Obsidian wiki 链接     | `[[笔记标题]]` 或 `[[笔记#标题\|别名]]`         |
| 标注框（Callout）      | `> [!note] 标题` / `> [!warning] 标题`         |
| 脚注                   | `正文[^id]` + `[^id]: 脚注内容`                |
| GFM 表格               | 标准 Markdown 表格                             |

Wiki 链接在页面标题匹配时会自动解析为真实文章链接，否则渲染为占位锚点。

## 自定义外观

所有颜色变量定义在 `assets/styles.css` 顶部。两套主题为 `[data-theme="light"]` 和 `[data-theme="dark"]`。修改 `--accent` / `--amber` 变量即可更换整体配色。

主题偏好保存在 `localStorage` 的 `luvsic-theme` 键中，首次访问时自动跟随系统 `prefers-color-scheme`。

## 设计上的限制

- **无服务端渲染 / 无单篇文章 SEO 元数据。** 这是纯客户端渲染方案。如果需要 SEO，可以添加构建步骤预生成每个 `post.html` 变体——`assets/app.js` 中的渲染管线是可移植的。
- **Wiki 链接图是扁平的** — 链接仅通过 slug 化的标题匹配，没有反向链接面板。
- **没有内置搜索** — 小站点用 Cmd+F 基本够用。也可以在此基础上接入 Lunr.js 等基于 `posts/index.json` 的搜索方案。

## 许可

随意使用。
