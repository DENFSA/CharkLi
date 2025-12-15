// CharkLi/src/view/layout.ts

// ОНОВЛЕНО: Тепер bodyClass є опціональним параметром
export function layout(opts: { title: string; body: string; bodyClass?: string }) { 
  
  // Додаємо логіку використання bodyClass, якщо він переданий
  const bodyClass = opts.bodyClass || "auth-page"; 

  return `<!doctype html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${opts.title}</title>
    
    <link rel="icon" type="image/svg+xml" href="/images/logo.svg?v=2">
    
    <link rel="stylesheet" href="/styles.css">
    <script src="/app.js" defer></script>
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