// CharkLi/src/index.ts (ОНОВЛЕНО)

import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import path from "path";
import cookieParser from "cookie-parser";
// >>>>>>>>>> ІМПОРТ seedNewUser
import { db, seedNewUser } from "./db/database"; 
import { layout } from "./view/layout";
import { renderLogin } from "./view/login";
import { renderCharacters } from "./view/characters"; 
import { renderCharacterSheet } from "./view/character_sheet";
const USER_COOKIE = "dnd_user_id"; 
const HASH_SALT_ROUNDS = 10;
const SESSION_SECRET = "VERY_SECURE_SECRET_KEY"; // У реальному проекті це має бути у .env

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));

app.use(express.static(path.resolve("public")));
app.use(express.static(path.resolve("dist")));

type User = {
  id: number;
  email: string;
  password_hash: string;
};

// Middleware для перевірки авторизації (checkAuth)
function checkAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.signedCookies[USER_COOKIE];

  if (userId) {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
    if (user) {
      (req as any).user = user; 
      return next();
    }
  }
  res.redirect("/login");
}

// ====================================================================
// AUTH ROUTES
// ====================================================================

// 1. Головна сторінка: перенаправлення на вхід
app.get("/", (_req, res) => res.redirect("/login")); // <<< ЗМІНЕНО: перенаправляємо на /login для неавторизованих

// 2. Сторінка входу (Page 1)
app.get("/login", (req, res) => {
  const error = typeof req.query.error === "string" ? req.query.error : "";
  res.send(renderLogin({ error }));
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      return res.redirect("/login?error=" + encodeURIComponent("Введіть email та пароль"));
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email) as User | undefined;

    if (!user) {
      return res.redirect("/login?error=" + encodeURIComponent("Користувача не знайдено"));
    }

    const ok = await bcrypt.compare(password, user.password_hash);

    if (ok) {
      // Успішний вхід: встановлюємо підписану куку з ID користувача
      res.cookie(USER_COOKIE, user.id, {
        signed: true,
        httpOnly: true, // Запобігає доступу з JS
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 тиждень
        // secure: process.env.NODE_ENV === "production"
      });
      return res.redirect("/characters");
    }

    return res.redirect("/login?error=" + encodeURIComponent("Невірний email або пароль"));

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.redirect("/login?error=" + encodeURIComponent("Помилка сервера"));
  }
});

// ... (AUTH ROUTES: app.get("/"), app.get("/login"), app.post("/login"), app.post("/logout") залишаються без змін)

// ---------------------- REGISTER ----------------------
app.post("/register", async (req, res) => {
  try {
    const { email, password, password2 } = req.body as {
      email: string;
      password: string;
      password2: string;
    };

    if (!email || !password || !password2) {
        return res.redirect("/login?error=" + encodeURIComponent("Будь ласка, заповніть всі поля."));
    }

    if (password !== password2) {
        return res.redirect("/login?error=" + encodeURIComponent("Паролі не співпадають."));
    }

    // 1. Перевірка, чи існує користувач
    const existingUser = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email) as Pick<User, 'id'> | undefined;
      
    if (existingUser) {
        return res.redirect("/login?error=" + encodeURIComponent("Користувач з таким email вже існує."));
    }

    // 2. Хешування пароля
    const password_hash = await bcrypt.hash(password, HASH_SALT_ROUNDS);

    // 3. Збереження в базу даних
    const result = db
        .prepare("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, datetime('now'))")
        .run(email, password_hash);

    const newUserId = result.lastInsertRowid as number;

    // 4. >>>>>>>>>> ВИКЛИКАЄМО ДОДАВАННЯ ДЕМО-ПЕРСОНАЖА З НОВОЮ СХЕМОЮ
    seedNewUser(newUserId, email);

    // 5. Автоматичний вхід: встановлюємо куку
    res.cookie(USER_COOKIE, newUserId, {
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.redirect("/characters");

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.redirect("/login?error=" + encodeURIComponent("Помилка при реєстрації."));
  }
});

app.post("/logout", (_req, res) => {
    res.clearCookie(USER_COOKIE);
    res.redirect("/login");
});

// ====================================================================
// PROTECTED ROUTES (ВИКОРИСТОВУЄМО checkAuth)
// ====================================================================

// --- CHARACTERS PAGE (Page 2) ---
app.get("/characters", checkAuth, (req, res) => {
    const user = (req as any).user as User;

    // Отримання персонажів користувача з оновленої таблиці characters
    const characters = db.prepare(`
        SELECT id, name, dnd_class, level, image_url 
        FROM characters 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    `).all(user.id) as { id: number; name: string; dnd_class: string; level: number; image_url: string }[];
    
    res.send(renderCharacters({ userEmail: user.email, characters }));
});

// --- CHARACTER SHEET PAGE (Page 3) - ОНОВЛЕНО ---
app.get("/character/:id", checkAuth, (req, res) => {
    const userId = (req as any).user.id;
    const charId = req.params.id;

    if (charId === 'new') {
        // Placeholder для форми створення
        return res.send(renderCharacterSheet({
            // Передаємо порожні, коректно типізовані дані
            id: -1, user_id: userId, name: "Новий Герой", dnd_class: "", level: 1, race: "", background: "", alignment: "N",
            str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
            ac: 10, speed: 30, max_hp: 10, current_hp: 10, temp_hp: 0, inspiration: 0,
            personality_traits: "", ideals: "", bonds: "", flaws: "", history_notes: "",
            // !!! ФІКС: Передаємо коректні порожні масиви JSON !!!
            proficiencies_json: '{"skills": [], "saves": [], "other": []}', 
            inventory_json: '{"items": [], "capital": {"gp": 0, "sp": 0, "cp": 0, "pp": 0, "ep": 0}}', 
            features_json: '[]', // Має бути порожній масив, а не об'єкт
            spells_json: '{"slots": {}, "list": []}', 
            weapons_json: '[]', // Має бути порожній масив, а не об'єкт
            appearance_json: '{}',
            image_url: "",
        }));
    }

    // 1. Отримання повних даних персонажа
    const character = db.prepare(`
        SELECT *
        FROM characters 
        WHERE id = ? AND user_id = ?
    `).get(charId, userId);

    if (!character) {
        return res.status(404).send(layout({
            title: "Помилка 404",
            body: `<h1 style="font-family:system-ui;color:var(--text);padding:24px">Персонажа не знайдено або він належить іншому користувачеві</h1>`,
        }));
    }

    // 2. Рендеринг листа
    res.send(renderCharacterSheet(character as any)); 
});

app.post("/character/:id", checkAuth, (req, res) => {
    const userId = (req as any).user.id;
    const charId = req.params.id; // Це буде 'new' або справжній ID, але ми використовуємо req.body.id = -1 для нового

    // Використовуємо ID з прихованого поля форми, щоб визначити, INSERT чи UPDATE
    const formId = Number(req.body.id);
    const isNewCharacter = formId === -1;

    // Перевірка безпеки для UPDATE
    if (!isNewCharacter && String(charId) !== String(formId)) {
        return res.status(400).send("Security Error: ID mismatch");
    }

    try {
        const body = req.body;
        
        // 1. СТВОРЕННЯ НОВОГО proficiencies_json (для INSERT та UPDATE)
        const newProficiencies: any = {
            skills: body.proficient_skills 
                ? body.proficient_skills.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) 
                : [],
            saves: body.proficient_saves 
                ? body.proficient_saves.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0) 
                : [],
            other: body.proficiencies_other 
                ? body.proficiencies_other.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
                : []
        };
        const updatedProficienciesJson = JSON.stringify(newProficiencies);


        // Загальний масив значень для обох операцій
        const baseValues = [
            body.name, body.dnd_class, Number(body.level), body.race, body.background, body.alignment,
            Number(body.str), Number(body.dex), Number(body.con), Number(body.int), Number(body.wis), Number(body.cha),
            Number(body.ac), Number(body.speed), Number(body.max_hp), Number(body.current_hp), Number(body.temp_hp), 
            body.inspiration === 'on' ? 1 : 0, 
            body.personality_traits, body.ideals, body.bonds, body.flaws, body.history_notes,
            body.weapons_json, updatedProficienciesJson, body.features_json, body.spells_json, body.inventory_json, body.appearance_json,
            body.image_url,
        ];

        let finalCharId = formId;

        if (isNewCharacter) {
            // >>>>>>>>>>>>>>> ВСТАВКА НОВОГО ПЕРСОНАЖА (INSERT) <<<<<<<<<<<<<<<<<
            const insertStmt = db.prepare(`
                INSERT INTO characters (
                    user_id, name, dnd_class, level, race, background, alignment,
                    str, dex, con, int, wis, cha,
                    ac, speed, max_hp, current_hp, temp_hp, inspiration,
                    personality_traits, ideals, bonds, flaws, history_notes,
                    weapons_json, proficiencies_json, features_json, spells_json, inventory_json, appearance_json,
                    image_url, created_at
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, ?, ?,
                    ?, datetime('now')
                )
            `);
            
            const insertValues = [userId, ...baseValues];
            const result = insertStmt.run(...insertValues);
            finalCharId = result.lastInsertRowid as number;

        } else {
            // >>>>>>>>>>>>>>> ОНОВЛЕННЯ ІСНУЮЧОГО ПЕРСОНАЖА (UPDATE) <<<<<<<<<<<<<<<<<
            
            // Перевірка існування (як було раніше, але тепер не потрібна, якщо ми знаємо, що це UPDATE)
            const exists = db.prepare(`SELECT id FROM characters WHERE id = ? AND user_id = ?`).get(formId, userId);
            if (!exists) {
                return res.status(404).send("Character not found or access denied.");
            }

            const updateStmt = db.prepare(`
                UPDATE characters SET
                    name = ?, dnd_class = ?, level = ?, race = ?, background = ?, alignment = ?,
                    str = ?, dex = ?, con = ?, int = ?, wis = ?, cha = ?,
                    ac = ?, speed = ?, max_hp = ?, current_hp = ?, temp_hp = ?, inspiration = ?,
                    personality_traits = ?, ideals = ?, bonds = ?, flaws = ?, history_notes = ?,
                    weapons_json = ?, proficiencies_json = ?, features_json = ?, spells_json = ?, inventory_json = ?, appearance_json = ?,
                    image_url = ?
                WHERE id = ? AND user_id = ?
            `);
            
            const updateValues = [...baseValues, formId, userId];
            updateStmt.run(...updateValues);
        }

        // 5. Успішне збереження: перенаправляємо назад на лист персонажа
        res.redirect(`/character/${finalCharId}`);

    } catch (err) {
        console.error("CHARACTER SAVE/INSERT ERROR:", err);
        res.redirect(`/character/${charId}?error=` + encodeURIComponent("Помилка збереження даних. Перевірте формат."));
    }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/login`);
});

