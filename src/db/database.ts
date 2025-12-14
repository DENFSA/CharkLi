// CharkLi/src/db/database.ts

import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve("data.db");
export const db = new Database(dbPath);

// =======================================================
// 1. ТАБЛИЦЯ КОРИСТУВАЧІВ (users)
// =======================================================
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`).run();

// =======================================================
// 2. ТАБЛИЦЯ ПЕРСОНАЖІВ (characters) - Комплексна схема
// Зберігаємо лише базові значення та великі текстові блоки.
// Похідні (бонус владения, ініціатива, модифікатори) обчислюються в коді.
// =======================================================
db.prepare(`
  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,          -- Зв'язок з користувачем
    
    -- Ідентифікація та мета
    name TEXT NOT NULL,
    dnd_class TEXT,       
    level INTEGER,        
    race TEXT,            
    background TEXT,      
    alignment TEXT,       
    
    -- Базові Характеристики (ABILITIES)
    str INTEGER,          -- Сила
    dex INTEGER,          -- Спритність
    con INTEGER,          -- Статура
    int INTEGER,          -- Інтелект
    wis INTEGER,          -- Мудрість
    cha INTEGER,          -- Харизма

    -- Динамічні Бойові показники (необхідні для швидкого відображення)
    ac INTEGER,           -- Клас Захисту (КЗ)
    speed INTEGER,        -- Швидкість
    max_hp INTEGER,       -- Максимальні Хіти (базові)
    current_hp INTEGER,   -- Поточні Хіти
    temp_hp INTEGER,      -- Тимчасові Хіти
    inspiration INTEGER,  -- Натхнення (0 або 1)
    
    -- Рольова частина (великі текстові блоки)
    personality_traits TEXT, -- Риси характеру
    ideals TEXT,             -- Ідеали
    bonds TEXT,              -- Прив'язаності
    flaws TEXT,              -- Недоліки
    history_notes TEXT,      -- Історія персонажа та Замітки

    -- Комплексні дані (зберігаємо у форматі JSON-рядків)
    proficiencies_json TEXT, -- Владання, мови, набори, навики, спасброски (JSON)
    inventory_json TEXT,     -- Інвентар та Капітал (JSON: items[], capital{})
    features_json TEXT,      -- Особливості та Уміння (JSON)
    spells_json TEXT,        -- Заклинання та деталі кастера (JSON)
    weapons_json TEXT,       -- Озброєння (JSON)
    appearance_json TEXT,    -- Зовнішність (зріст, вага, колір очей і т.д. у JSON)
    
    image_url TEXT,          -- Зображення для плитки (Page 2)
    created_at TEXT NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// =======================================================
// 3. ФУНКЦІЯ ДОДАВАННЯ ДЕМО-ПЕРСОНАЖА (для нових користувачів)
// =======================================================
export function seedNewUser(userId: number, email: string) {
    const defaultCharacter = {
        user_id: userId,
        name: email.split('@')[0] + "'s Hero",
        dnd_class: "Fighter",
        level: 1,
        race: "Human",
        background: "Soldier",
        alignment: "Neutral Good",

        // Базові характеристики
        str: 15, dex: 14, con: 13, int: 10, wis: 12, cha: 8,

        // Динамічні показники для 1-го рівня Fighter
        ac: 17, // Chain mail + Shield
        speed: 30,
        max_hp: 11, // d10 Hit Die + CON mod (+1)
        current_hp: 11,
        temp_hp: 0,
        inspiration: 0,

        // Рольова
        personality_traits: "Я завжди ввічливий та поважаю інших.",
        ideals: "Честь. Я ніколи не буду брехати.",
        bonds: "Я зобов'язаний життям лідеру міської варти.",
        flaws: "Маю сильну схильність до надмірного вживання алкоголю.",
        history_notes: "Був призваний до армії в юному віці, де навчився дисципліні та мистецтву війни.",
        
        // Комплексні дані (JSON заглушки)
        proficiencies_json: JSON.stringify({
            skills: ["Acrobatics", "Athletics"], // Владання навичками
            saves: ["Strength", "Constitution"], // Владання спасбросками
            other: ["Common", "Dwarven", "All armor", "Shields", "Simple/Martial Weapons"] // Інші владання
        }),
        inventory_json: JSON.stringify({
            items: ["Chain Mail", "Shield", "Longsword", "Explorer's Pack"],
            capital: { cp: 50, sp: 0, ep: 0, gp: 10, pp: 0 }
        }),
        features_json: JSON.stringify([{ name: "Бойовий Стиль", description: "Оборона" }, { name: "Другий Подих", description: "Реакцією відновлює 1к10 + Рівень ХП." }]),
        spells_json: JSON.stringify({ slots: {}, list: [] }), // Порожній для Fighter
        weapons_json: JSON.stringify([{ name: "Longsword", damage: "1d8", type: "slashing" }]),
        appearance_json: JSON.stringify({ height: "180см", weight: "85кг", eyes: "Сині", hair: "Коричневе", age: 25, skin: "Світла" }),

        image_url: "https://i.pravatar.cc/150?img=" + (userId % 7 + 10),
    };

    const insertCharStmt = db.prepare(`
        INSERT INTO characters (
            user_id, name, dnd_class, level, race, background, alignment, 
            str, dex, con, int, wis, cha, ac, speed, max_hp, current_hp, temp_hp, inspiration,
            personality_traits, ideals, bonds, flaws, history_notes, 
            proficiencies_json, inventory_json, features_json, spells_json, weapons_json, appearance_json, image_url, created_at
        )
        VALUES (
            @user_id, @name, @dnd_class, @level, @race, @background, @alignment, 
            @str, @dex, @con, @int, @wis, @cha, @ac, @speed, @max_hp, @current_hp, @temp_hp, @inspiration,
            @personality_traits, @ideals, @bonds, @flaws, @history_notes, 
            @proficiencies_json, @inventory_json, @features_json, @spells_json, @weapons_json, @appearance_json, @image_url, datetime('now')
        )
    `);

    insertCharStmt.run(defaultCharacter);
}
