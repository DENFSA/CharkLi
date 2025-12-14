import { layout } from "./layout";

export function renderLogin(opts?: { error?: string }) {
  const error = opts?.error
    ? `<div class="alert">${escapeHtml(opts.error)}</div>`
    : "";

  return layout({
    title: "Вхід — CharKli",
    body: `
<section class="card auth">
  <div class="brand">
    <img src="/images/logo.svg" class="brand__img" />
    <h1 class="brand__name">CharKli</h1>
  </div>

  ${error}

  <!-- LOGIN -->
  <form class="form" id="loginForm" method="post" action="/login">
    <h2>Вхід</h2>

    <label class="field">
      <span>Email</span>
      <input name="email" type="email" required />
    </label>

    <label class="field">
      <span>Пароль</span>
      <input name="password" type="password" required />
    </label>

    <button class="btn btn--primary">Увійти</button>

    <p class="switch">
      Немає акаунту?
      <button type="button" data-switch="register">Зареєструватись</button>
    </p>
  </form>

  <!-- REGISTER -->
  <form class="form hidden" id="registerForm" method="post" action="/register">
    <h2>Реєстрація</h2>

    <label class="field">
      <span>Email</span>
      <input name="email" type="email" required />
    </label>

    <label class="field">
      <span>Пароль</span>
      <input name="password" type="password" required />
    </label>

    <label class="field">
      <span>Повторіть пароль</span>
      <input name="password2" type="password" required />
    </label>

    <button class="btn btn--primary">Створити акаунт</button>

    <p class="switch">
      Вже є акаунт?
      <button type="button" data-switch="login">Увійти</button>
    </p>
  </form>
</section>
`,
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[c]
  );
}
