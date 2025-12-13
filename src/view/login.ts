import { layout } from "./layout";

export function renderLogin(opts?: { error?: string }) {
  const error = opts?.error
    ? `<div class="alert" role="alert">${escapeHtml(opts.error)}</div>`
    : "";

  return layout({
    title: "Вхід — CharKli",
    body: `
<section class="card auth">
  <div class="brand">
  <img src="/images/logo.svg" alt="CharKli logo" class="brand__img" />
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
      <input name="password" type="password" placeholder="your password" required />
    </label>

    <button class="btn btn--primary" type="submit">Увійти</button>
    <div class="muted small">MVP: <b>demo@dnd.ua</b> / <b>demo</b></div>
  </form>
</section>
`,
  });
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
