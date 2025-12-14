// CharkLi/src/view/characters.ts

// Тип для даних персонажа, які потрібні на сторінці-плитці
interface CharacterCardData {
  id: number;
  name: string;
  dnd_class: string;
  level: number;
  image_url: string;
}

// Визначення опцій, які приймає функція renderCharacters
interface RenderCharactersOpts {
  userEmail: string;
  // >>>>>> ДОДАНО: ТЕПЕР ФУНКЦІЯ ПРИЙМАЄ МАСИВ ПЕРСОНАЖІВ
  characters: CharacterCardData[]; 
}

// Функція для екранування HTML-символів (може знадобитися)
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

// Імпорт layout з CharkLi/src/view/layout.ts
import { layout } from "./layout";

function renderCharacterCard(char: CharacterCardData) {
  // Використовуємо властивості з бази даних: dnd_class, level, image_url
  return `
    <a href="/character/${char.id}" class="char-card">
      <div class="char-card__image-container">
        <img src="${escapeHtml(char.image_url)}" alt="Image of ${escapeHtml(char.name)}" class="char-card__image" />
      </div>
      <div class="char-card__info">
        <h2 class="char-card__name">${escapeHtml(char.name)}</h2>
        <div class="char-card__details muted small">
          ${escapeHtml(char.dnd_class)} • Рівень ${char.level}
        </div>
      </div>
    </a>
  `;
}

function renderNewCharacterCard() {
  // Кнопка для створення нового персонажа
  return `
    <a href="/character/new" class="char-card char-card--new">
      <div class="char-card__icon-container">
        <span class="char-card__icon">✚</span>
      </div>
      <h2 class="char-card__name">Створити нового персонажа</h2>
    </a>
  `;
}

export function renderCharacters(opts: RenderCharactersOpts) {
  // Збираємо картки, які прийшли з бази даних
  const characterCards = opts.characters.map(renderCharacterCard).join("");
  
  // Додаємо картку "Створити нового"
  const allCards = renderNewCharacterCard() + characterCards;

  return layout({
    title: "Мої персонажі — CharKli",
    // Тут ми використовуємо клас page, але для сторінки персонажів його треба трохи змінити 
    // щоб контент не був центрований вертикально, а починався зверху.
    body: `
<section class="characters-page">
  <header class="page-header">
    <div class="brand">
        <img src="/images/logo.svg" class="brand__img" />
        <h1 class="page-title">Мої персонажі</h1>
    </div>
    <p class="muted small">Користувач: ${escapeHtml(opts.userEmail)}</p>
  </header>

  <div class="char-list">
    ${allCards}
  </div>

  <footer class="page-footer">
    <form method="POST" action="/logout">
      <button class="btn btn--secondary">Вийти</button>
    </form>
  </footer>
</section>
`,
  });
}