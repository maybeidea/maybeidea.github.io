/* ============================================================
   Luv(sic) Notes — shared client-side logic
   ------------------------------------------------------------
   Exposes: window.LuvsicBlog = { config, posts, theme, md, ... }
   ============================================================ */

(function () {
  "use strict";

  const LuvsicBlog = {};

  /* ------------------------------------------------------------
     Theme handling
     ------------------------------------------------------------ */
  const STORAGE_KEY = "luvsic-theme";

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const hljsLight = document.getElementById("hljs-light");
    const hljsDark  = document.getElementById("hljs-dark");
    if (hljsLight && hljsDark) {
      hljsLight.disabled = (theme !== "light");
      hljsDark.disabled  = (theme !== "dark");
    }
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  function resolveInitialTheme(defaultTheme) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (_) {}
    if (defaultTheme === "dark" || defaultTheme === "light") return defaultTheme;
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function bindThemeToggle(buttonSelector) {
    const btn = typeof buttonSelector === "string"
      ? document.querySelector(buttonSelector)
      : buttonSelector;
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark"
        ? "light" : "dark";
      applyTheme(next);
    });
  }

  LuvsicBlog.applyTheme = applyTheme;
  LuvsicBlog.resolveInitialTheme = resolveInitialTheme;
  LuvsicBlog.bindThemeToggle = bindThemeToggle;

  /* ------------------------------------------------------------
     Data loading
     ------------------------------------------------------------ */
  async function loadJSON(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  async function loadText(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.text();
  }

  LuvsicBlog.loadJSON = loadJSON;
  LuvsicBlog.loadText = loadText;

  async function loadConfig() {
    return loadJSON("config.json");
  }

  /* ------------------------------------------------------------
     Posts index — supports two formats:
       New: { posts: ["a.md", "b.md"] }   → metadata derived from frontmatter
       Old: { posts: [{slug, file, title, ...}] } → used as-is
     ------------------------------------------------------------ */
  async function loadPostsIndex() {
    const data = await loadJSON("posts/index.json");

    let fileNames;
    if (Array.isArray(data.posts) && data.posts.length > 0
        && typeof data.posts[0] === "string") {
      fileNames = data.posts;
    } else {
      if (Array.isArray(data.posts)) {
        data.posts.sort((a, b) => (a.date < b.date ? 1 : -1));
      }
      return data;
    }

    const posts = await Promise.all(fileNames.map(async (file) => {
      try {
        const text = await loadText(`posts/${encodeURIComponent(file)}`);
        const { data: fm, body } = parseFrontmatter(text);
        return derivePostMeta(file, fm, body);
      } catch (err) {
        console.warn(`[posts] skip ${file}:`, err.message);
        return null;
      }
    }));

    const valid = posts.filter(Boolean);
    valid.sort((a, b) => (a.date < b.date ? 1 : -1));
    return { posts: valid };
  }

  function derivePostMeta(file, fm, body) {
    const stem = file.replace(/\.md$/i, "");
    const tags = Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []);

    const excerpt = (fm.excerpt || extractFirstParagraph(body) || "").trim();

    let readingTime = Number(fm.readingTime);
    if (!readingTime || isNaN(readingTime)) readingTime = estimateReadingTime(body);

    let featuredFormula = fm.featuredFormula || null;
    if (!featuredFormula) {
      const m = body.match(/\$\$([\s\S]+?)\$\$/);
      if (m) {
        const f = m[1].replace(/\s+/g, " ").trim();
        if (f.length <= 80) featuredFormula = f;
      }
    }

    return {
      slug: (fm.slug || stem).toString().trim(),
      file,
      title: (fm.title || stem).toString().trim(),
      date: (fm.date || new Date().toISOString().slice(0, 10)).toString().trim(),
      category: (fm.category || "notes").toString().trim(),
      tags,
      excerpt,
      readingTime,
      featuredFormula
    };
  }

  function extractFirstParagraph(body) {
    const lines = body.split(/\r?\n/);
    const para = [];
    let inFence = false;
    for (const line of lines) {
      const t = line.trim();
      if (/^```/.test(t)) { inFence = !inFence; continue; }
      if (inFence) continue;
      if (!t) { if (para.length) break; else continue; }
      if (/^#{1,6}\s/.test(t) || /^>/.test(t) || /^[-*+]\s/.test(t)
          || /^\d+\.\s/.test(t) || /^\$\$/.test(t) || /^<.+>/.test(t)
          || /^---+$/.test(t) || /^\|/.test(t)) continue;
      para.push(t);
      if (para.join(" ").length > 200) break;
    }
    let s = para.join(" ")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_m, a, b) => b || a)
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\$([^$]+)\$/g, "$1")
      .replace(/\s+/g, " ")
      .trim();
    if (s.length > 140) s = s.slice(0, 140).trimEnd() + "…";
    return s;
  }

  function estimateReadingTime(body) {
    const cleaned = body.replace(/```[\s\S]*?```/g, "").replace(/\$\$[\s\S]*?\$\$/g, "");
    const cn = (cleaned.match(/[\u4e00-\u9fa5]/g) || []).length;
    const en = cleaned.replace(/[\u4e00-\u9fa5]/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(cn / 300 + en / 200));
  }

  LuvsicBlog.loadConfig = loadConfig;
  LuvsicBlog.loadPostsIndex = loadPostsIndex;

  /* ------------------------------------------------------------
     Utilities
     ------------------------------------------------------------ */
  const HTML_ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPE[ch]);
  }

  function slugify(value) {
    const slug = String(value)
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "note";
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("en", {
        year: "numeric", month: "short", day: "2-digit"
      }).format(new Date(value + "T00:00:00"));
    } catch (_) { return value; }
  }

  LuvsicBlog.escapeHtml = escapeHtml;
  LuvsicBlog.slugify = slugify;
  LuvsicBlog.formatDate = formatDate;

  /* ------------------------------------------------------------
     Frontmatter parser
     Supports: scalar, "quoted", [inline, list], multiline:
                                                  - list
                                                  - items
     ------------------------------------------------------------ */
  function parseFrontmatter(text) {
    const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    if (!match) return { data: {}, body: text };
    const body = text.slice(match[0].length);
    const data = {};
    const lines = match[1].split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const kv = lines[i].match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1].trim();
      let value = kv[2].trim();

      if (value === "" && i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        const list = [];
        while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
          i++;
          const item = lines[i].replace(/^\s*-\s+/, "").trim()
            .replace(/^["']|["']$/g, "");
          if (item) list.push(item);
        }
        data[key] = list;
        continue;
      }

      if (/^\[.*\]$/.test(value)) {
        value = value.slice(1, -1).split(",")
          .map((v) => v.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
      } else if (/^["'].*["']$/.test(value)) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    }
    return { data, body };
  }

  LuvsicBlog.parseFrontmatter = parseFrontmatter;

  /* ------------------------------------------------------------
     Markdown → HTML
     ------------------------------------------------------------ */
  function configureMarked() {
    if (!window.marked) return;
    marked.use({
      gfm: true,
      breaks: false,
      renderer: {
        code(token) {
          const rawLang = String(token.lang || "text").trim().split(/\s+/)[0].toLowerCase();
          const lang = /^[a-z0-9+#-]+$/.test(rawLang) ? rawLang : "text";
          return [
            '<div class="code-frame">',
            '<button class="copy-code" type="button" aria-label="Copy code">Copy</button>',
            '<pre tabindex="0"><code class="language-' + lang + '">',
            escapeHtml(token.text),
            "</code></pre>",
            "</div>"
          ].join("");
        },
        heading(token) {
          const text = this.parser.parseInline(token.tokens);
          const plain = token.tokens.map((t) => t.raw || t.text || "").join(" ");
          const id = slugify(plain);
          return `<h${token.depth} id="${id}">${text}</h${token.depth}>`;
        }
      }
    });
  }

  function protectMath(markdown) {
    const tokens = [];
    const save = (raw) => {
      const key = `@@MATH_TOKEN_${tokens.length}@@`;
      tokens.push(raw);
      return key;
    };

    let text = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (match) => save(match));

    text = text.replace(/(^|[^\\$])\$([^\n$]+?)\$/g, (match, prefix, inner) => {
      if (!inner.trim()) return match;
      return prefix + save("$" + inner + "$");
    });

    return { text, tokens };
  }

  function restoreMath(html, tokens) {
    return tokens.reduce(
      (output, value, index) => output.split(`@@MATH_TOKEN_${index}@@`).join(escapeHtml(value)),
      html
    );
  }

  function transformWikiLinks(markdown, postsBySlugifiedTitle) {
    return markdown.replace(/\[\[([^\]|#]+)(#[^\]|]+)?(?:\|([^\]]+))?\]\]/g,
      (_match, page, heading, alias) => {
        const pageName = page.trim();
        const headingName = heading ? heading.slice(1).trim() : "";
        const label = (alias || (headingName ? `${pageName} § ${headingName}` : pageName)).trim();

        const key = slugify(pageName);
        const matchedSlug = postsBySlugifiedTitle && postsBySlugifiedTitle[key];
        const url = matchedSlug
          ? `post.html?slug=${encodeURIComponent(matchedSlug)}${headingName ? "#" + encodeURIComponent(slugify(headingName)) : ""}`
          : `#${encodeURIComponent(key)}`;

        return `<a class="wiki-link" href="${url}">${escapeHtml(label)}</a>`;
      });
  }

  function transformCallouts(markdown) {
    const labels = { note: "Note", info: "Info", tip: "Tip",
                     warning: "Warning", caution: "Caution", quote: "Quote" };
    const lines = markdown.split("\n");
    const out = [];

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^>\s*\[!([a-zA-Z0-9-]+)\]\s*(.*)$/);
      if (!m) { out.push(lines[i]); continue; }

      const type = m[1].toLowerCase().replace(/[^a-z0-9-]/g, "") || "note";
      const title = m[2].trim() || labels[type] || type;
      const bodyLines = [];

      while (i + 1 < lines.length && /^>\s?/.test(lines[i + 1])) {
        i++;
        bodyLines.push(lines[i].replace(/^>\s?/, ""));
      }
      const body = bodyLines.join("\n").trim();

      out.push(
        `<div class="callout ${type}">` +
          `<div class="callout-title">${escapeHtml(title)}</div>` +
          `<div class="callout-body">${body ? marked.parse(body) : ""}</div>` +
        `</div>`
      );
    }
    return out.join("\n");
  }

  function transformFootnotes(markdown) {
    const lines = markdown.split("\n");
    const content = [];
    const notes = [];

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^\[\^([^\]]+)\]:\s*(.*)$/);
      if (!m) { content.push(lines[i]); continue; }

      const id = m[1].trim();
      const body = [m[2]];
      while (i + 1 < lines.length && /^(?: {2,}|\t)/.test(lines[i + 1])) {
        i++;
        body.push(lines[i].replace(/^(?: {2,}|\t)/, ""));
      }
      notes.push({ id, body: body.join("\n") });
    }

    let text = content.join("\n").replace(/\[\^([^\]]+)\]/g, (_m, id) => {
      const fid = slugify(id);
      return `<sup class="footnote-ref" id="fnref-${fid}"><a href="#fn-${fid}">${escapeHtml(id)}</a></sup>`;
    });

    if (!notes.length) return text;

    const items = notes.map((note) => {
      const fid = slugify(note.id);
      return `<li id="fn-${fid}">${marked.parse(note.body)}<a class="footnote-back" href="#fnref-${fid}" aria-label="Back to reference">↩</a></li>`;
    }).join("");

    return text + `\n\n<section class="footnotes" aria-label="Footnotes"><ol>${items}</ol></section>`;
  }

  function renderMarkdown(markdown, options) {
    options = options || {};
    if (!window.marked) return escapeHtml(markdown);
    configureMarked();

    const protectedMath = protectMath(markdown);
    let text = protectedMath.text;

    text = transformWikiLinks(text, options.postsBySlugifiedTitle);
    text = transformFootnotes(text);
    text = transformCallouts(text);

    const parsed = marked.parse(text);
    const restored = restoreMath(parsed, protectedMath.tokens);

    return window.DOMPurify
      ? DOMPurify.sanitize(restored, {
          ADD_TAGS: ["button", "section"],
          ADD_ATTR: ["aria-label", "tabindex", "id", "class"]
        })
      : restored;
  }

  LuvsicBlog.renderMarkdown = renderMarkdown;

  /* ------------------------------------------------------------
     Post-render enhancement: highlight + math + copy
     ------------------------------------------------------------ */
  function enhanceRenderedContent(root) {
    root = root || document.body;

    if (window.hljs) {
      root.querySelectorAll("pre code").forEach((block) => {
        try { hljs.highlightElement(block); } catch (_) {}
      });
    }

    if (window.renderMathInElement) {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$",  right: "$$",  display: true  },
          { left: "$",   right: "$",   display: false },
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true  }
        ],
        throwOnError: false,
        strict: "ignore"
      });
    }

    if (!root._copyBound) {
      root.addEventListener("click", (e) => {
        const btn = e.target.closest(".copy-code, .copy-btn");
        if (!btn) return;
        const frame = btn.closest(".code-frame, .code-wrap");
        const code = frame ? frame.querySelector("code") : null;
        if (!code) return;
        const original = btn.textContent;
        const text = code.innerText;
        const doDone = (ok) => {
          btn.textContent = ok ? "Copied" : "Failed";
          setTimeout(() => { btn.textContent = original; }, 1400);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(text).then(() => doDone(true), () => doDone(false));
        } else {
          try {
            const ta = document.createElement("textarea");
            ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
            document.body.appendChild(ta); ta.select();
            document.execCommand("copy"); document.body.removeChild(ta);
            doDone(true);
          } catch (_) { doDone(false); }
        }
      });
      root._copyBound = true;
    }
  }

  LuvsicBlog.enhanceRenderedContent = enhanceRenderedContent;

  /* ------------------------------------------------------------
     Topbar rendering
     ------------------------------------------------------------ */
  function renderTopbar(mountSelector, config) {
    const mount = typeof mountSelector === "string"
      ? document.querySelector(mountSelector) : mountSelector;
    if (!mount) return;

    const navItems = (config.nav || []).map((item) =>
      `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`
    ).join("");

    mount.innerHTML = `
      <div class="brand"><a href="index.html">${escapeHtml(config.site.brand || config.site.title)}</a></div>
      <div class="nav-wrap">
        <nav class="nav" aria-label="Primary navigation">${navItems}</nav>
        <button class="theme-toggle" type="button" aria-label="Toggle theme" id="theme-toggle">
          <span class="icon" aria-hidden="true">
            <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="12" cy="12" r="4.2"/>
              <path d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>
            </svg>
            <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.5 14.3A8.5 8.5 0 1 1 9.7 3.5a6.8 6.8 0 0 0 10.8 10.8z"/>
            </svg>
          </span>
          <span class="label-light">Dark</span>
          <span class="label-dark">Light</span>
        </button>
      </div>
    `;

    bindThemeToggle("#theme-toggle");
  }

  LuvsicBlog.renderTopbar = renderTopbar;

  /* ------------------------------------------------------------
     Footer
     ------------------------------------------------------------ */
  function renderFooter(mountSelector, config) {
    const mount = typeof mountSelector === "string"
      ? document.querySelector(mountSelector) : mountSelector;
    if (!mount) return;
    mount.innerHTML = escapeHtml(config.site.footer || "Written in quiet rooms.");
  }
  LuvsicBlog.renderFooter = renderFooter;

  /* Expose */
  window.LuvsicBlog = LuvsicBlog;
}());

