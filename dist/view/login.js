"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLogin = renderLogin;
const layout_1 = require("./layout");
function renderLogin(opts) {
    const error = opts?.error
        ? `<div class="alert" role="alert">${escapeHtml(opts.error)}</div>`
        : "";
    return (0, layout_1.layout)({
        title: "Вхід — CharKli",
        body: `
<section class="card auth">
  <div class="brand">
    <div class="brand__logo">🐉</div>
    <div>
      <h1 class="brand__name">CharKli</h1>
      <div class="muted">D&D 5e (2014) Character Sheet Builder</div>
    </div>
  </div>

  ${error}

  <form class="form" method="post" action="/login">
    <label class="field">
      <span>Email</span>
      <input name="email" type="email" placeholder="demo@dnd.ua" required />
    </label>

    <label class="field">
      <span>Пароль</span>
      <input name="password" type="password" placeholder="demo" required />
    </label>

    <button class="btn btn--primary" type="submit">Увійти</button>
    <div class="muted small">MVP: <b>demo@dnd.ua</b> / <b>demo</b></div>
  </form>
</section>
`,
    });
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
