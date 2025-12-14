// CharkLi/src/view/layout.ts

// ОНОВЛЕНО: Тепер bodyClass є опціональним параметром
export function layout(opts: { title: string; body: string; bodyClass?: string }) { 
  
  // Додаємо логіку використання bodyClass, якщо він переданий
  const bodyClass = opts.bodyClass || "auth-page"; 

  return `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="${bodyClass}">
  <main class="page">
    ${opts.body}
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;
}

function escapeHtml(s: string) {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return s.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}