"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.layout = layout;
function layout(opts) {
    return `<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(opts.title)}</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body class="auth-page">
  <main class="page">
    ${opts.body}
  </main>
  <script src="/app.js" defer></script>
</body>
</html>`;
}
function escapeHtml(s) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    };
    return s.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}
