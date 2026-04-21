# Luv(sic) Notes — Personal Blog

A quiet, dual-theme static blog. Markdown in, KaTeX out, no build step.

## Project structure

```
luvsic-blog/
├── index.html              # Home — hero + category filter + post grid
├── post.html               # Article page (reads ?slug= from URL)
├── about.html              # About page
│
├── config.json             # ← Site-wide config (title, nav, categories)
│
├── posts/
│   ├── index.json          # ← Post registry (metadata for every post)
│   ├── margins-for-memory.md
│   ├── on-quiet-proofs.md
│   ├── notebook-after-midnight.md
│   ├── a-syntax-for-rain.md
│   ├── half-remembered-proof.md
│   └── listening-to-nujabes.md
│
├── assets/
│   ├── styles.css          # Shared styles (dual theme + frosted glass)
│   └── app.js              # Shared JS (theme, markdown, topbar, footer)
│
└── README.md
```

## Running locally

Because the front-end fetches `config.json`, `posts/index.json`, and Markdown
files via `fetch()`, **you must serve the folder over HTTP** — opening the
file directly via `file://` will fail with a CORS error.

Any static server works:

```bash
# Python (built-in)
cd luvsic-blog
python3 -m http.server 8000
# → open http://localhost:8000

# Node
npx serve .

# PHP
php -S localhost:8000
```

## Deploying

This is a pure static site. Drop the folder into:

- **GitHub Pages** — push to a repo, enable Pages in settings
- **Cloudflare Pages** — connect repo, build command blank, output dir `/`
- **Vercel / Netlify** — drag-and-drop the folder
- **Any static host / S3 / nginx** — just serve the files

No build step. No Node dependency at deploy time.

## Adding a new post

1. **Write the Markdown.** Drop a new `.md` file into `posts/`. Use
   frontmatter for Obsidian-compatibility:

   ```markdown
   ---
   title: My New Note
   date: 2026-05-01
   category: essay
   tags: [memory, draft]
   ---

   Content starts here…
   ```

2. **Register it** in `posts/index.json`. Add one entry to the `posts`
   array:

   ```json
   {
     "slug": "my-new-note",
     "file": "my-new-note.md",
     "title": "My New Note",
     "date": "2026-05-01",
     "category": "essay",
     "tags": ["memory", "draft"],
     "excerpt": "A one-sentence lede that shows on the card.",
     "readingTime": 5,
     "featuredFormula": "e^{i\\pi} + 1 = 0"
   }
   ```

   Fields:
   - `slug` (required) — URL segment, used in `post.html?slug=…`
   - `file` (required) — filename inside `posts/`
   - `category` (required) — must match an id in `config.json → categories`
   - `excerpt` — shown in the card
   - `featuredFormula` — optional KaTeX shown in the card
   - `readingTime` — integer minutes
   - `tags` — array of strings

3. **Refresh.** That's it. No build, no rebuild.

## Managing categories

Categories are defined once in `config.json`:

```json
"categories": [
  { "id": "essay", "name": "Essay", "description": "…", "accent": "accent" },
  { "id": "code",  "name": "Code",  "description": "…", "accent": "amber"  }
]
```

- `id` — short, lowercase; referenced by posts' `category` field
- `name` — shown on pills and chips
- `accent` — either `"accent"` (blue-gray/orange) or `"amber"` (warm amber)

The home-page filter bar is generated automatically from this list, with
per-category post counts.

## Markdown features supported

| Feature                        | Syntax                                         |
| ------------------------------ | ---------------------------------------------- |
| Inline math                    | `$E = mc^2$`                                   |
| Block math                     | `$$ \int_a^b f(x)\,dx $$`                      |
| Fenced code with copy button   | ` ```javascript … ``` `                        |
| Obsidian wiki-links            | `[[Note Title]]` or `[[Note#Heading\|alias]]`  |
| Callouts                       | `> [!note] Title` / `> [!warning] Title`       |
| Footnotes                      | `text[^id]` + `[^id]: definition`              |
| GFM tables                     | Standard Markdown tables                       |

Wiki-links automatically resolve to real posts when the page title matches;
otherwise they become placeholder anchors.

## Customizing the look

All colors live in CSS variables at the top of `assets/styles.css`. The two
themes are `[data-theme="light"]` and `[data-theme="dark"]`. Change
`--accent` / `--amber` to reskin the whole site.

Theme preference is saved in `localStorage` under key `luvsic-theme` and
respects `prefers-color-scheme` on first visit.

## Limitations (by design)

- **No SSR / no SEO metadata for individual posts.** This is a client-only
  renderer. If SEO matters, add a build step that pre-generates `post.html`
  variants — the rendering pipeline in `assets/app.js` is portable.
- **Wiki-link graph is flat** — links resolve by slugified title only, no
  backlinks panel.
- **Search isn't built in** — small site, Cmd+F is often enough. Adding
  Lunr.js or similar over `posts/index.json` is straightforward.

## License

Yours. Do what you like with it.
