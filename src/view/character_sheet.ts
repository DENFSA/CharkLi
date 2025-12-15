// Chakrli/src/view/character_sheet.ts

import { layout } from "./layout";
import { 
    calculateModifier, 
    getProficiencyBonus, 
    formatModifier, 
    AbilityScore, 
    calculateSaveThrow, 
    calculateInitiative, 
    calculatePassivePerception, 
    calculateSkillBonus, 
    SKILLS_MAP 
} from "../lib/dnd_utils";

// =======================================================
// INTERFACES (ТИПИ ДАНИХ)
// =======================================================

interface CharacterData {
    id: number;
    user_id: number;
    name: string;
    dnd_class: string;
    level: number;
    race: string;
    background: string;
    alignment: string;
    
    // Ability Scores
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;

    // Combat
    ac: number;
    speed: number;
    max_hp: number;
    current_hp: number;
    temp_hp: number;
    inspiration: number;

    // Roleplaying
    personality_traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    history_notes: string;

    // JSON fields 
    proficiencies_json: string;
    inventory_json: string;
    features_json: string;
    spells_json: string;
    weapons_json: string;
    appearance_json: string;
    
    image_url: string; // URL портрета
}

interface Proficiencies {
    skills: string[];
    saves: AbilityScore[];
    other: string[];
}

type AttackScore = 'str' | 'dex';

interface Weapon {
    name: string;
    damage: string;
    type: string;
    score: AttackScore; // Базова характеристика для атаки
    proficient: boolean; // Чи володіє персонаж
}

interface Inventory {
    items: string[];
    capital: Record<string, number>; 
}

interface Feature {
    name: string;
    description: string;
}

interface SpellList {
    slots: Record<string, number>; // { level1: 3, level2: 2 }
    list: string[]; // Просто список заклинань
}


// =======================================================
// HELPER FUNCTIONS
// =======================================================

function escapeHtml(s: string) {
    if (typeof s !== 'string') return '';
    const map: Record<string, string> = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return s.replace(/[&<>"']/g, (ch) => map[ch] ?? ch);
}

// =======================================================
// RENDER BLOCKS
// =======================================================

function renderAbilityScore(
    scoreName: AbilityScore, 
    scoreValue: number, 
    level: number, 
    proficiencies: Proficiencies
) {
    const mod = calculateModifier(scoreValue);
    const modFormatted = formatModifier(mod);
    
    const isProficientInSave = proficiencies.saves.includes(scoreName);
    const saveBonus = calculateSaveThrow(scoreValue, level, isProficientInSave);
    const saveBonusFormatted = formatModifier(saveBonus);
    
    const relevantSkills = Object.entries(SKILLS_MAP).filter(([_, ability]) => ability === scoreName);

    const skillsHtml = relevantSkills.map(([skillName, _]) => {
        const isProficientInSkill = proficiencies.skills.includes(skillName);
        const skillBonus = calculateSkillBonus(scoreValue, level, isProficientInSkill ? 'proficient' : 'none');
        const skillBonusFormatted = formatModifier(skillBonus); 

        return `
            <label class="skill-row">
                <span class="skill-row__name">
                    <input type="checkbox" ${isProficientInSkill ? 'checked' : ''} data-proficiency-toggle="skill" data-proficiency-name="${skillName}" /> 
                    ${skillName.replace(/ /g, '\u00a0')}
                </span>
                <span class="skill-row__bonus" data-skill-bonus="${skillName}">${skillBonusFormatted}</span>
            </label>
        `;
    }).join(''); 

    const saveThrowHtml = `
        <label class="save-throw" data-save-name="${scoreName}">
            <span class="save-throw__name">
                <input type="checkbox" ${isProficientInSave ? 'checked' : ''} data-proficiency-toggle="save" data-proficiency-name="${scoreName}" />
                Спас. ${scoreName}
            </span>
            <span class="save-throw__bonus" data-save-bonus="${scoreName}">${saveBonusFormatted}</span>
        </label>
    `;


    return `
      <div class="ability-score ability-score--${scoreName}">
        <label for="${scoreName}-score">${scoreName.toUpperCase()}</label>
        
        <div class="ability-score__modifier">
            <input 
                id="${scoreName}-score" 
                type="number" 
                value="${scoreValue}" 
                name="${scoreName}" 
                data-score-input="${scoreName}" 
                min="1" max="30"
            /> 
            <div data-ability-mod="${scoreName}">${modFormatted}</div>
        </div>
        
        <div class="ability-score__saves">
            ${saveThrowHtml}
        </div>
        <div class="ability-score__skills">
            ${skillsHtml}
        </div>
      </div>
    `;
}

// =======================================================
// MAIN RENDER FUNCTION
// =======================================================

export function renderCharacterSheet(char: CharacterData) {
    const pb = getProficiencyBonus(char.level);
    
    // !!! Парсинг JSON-даних !!!
    const proficiencies: Proficiencies = JSON.parse(char.proficiencies_json || '{"skills": [], "saves": [], "other": []}');
    // ФІКС: Забезпечуємо, що weapons завжди масив
    const weapons: Weapon[] = JSON.parse(char.weapons_json || '[]'); 
    const inventory: Inventory = JSON.parse(char.inventory_json || '{"items": [], "capital": {"gp": 0, "sp": 0, "cp": 0, "pp": 0, "ep": 0}}');
    
    // >>> ПАРСИНГ ОСОБЛИВОСТЕЙ, ЗАКЛИНАНЬ, ЗОВНІШНОСТІ ТА ЗОБРАЖЕННЯ <<<
    let features: Feature[] = [];
    try {
        features = JSON.parse(char.features_json || '[]'); 
        if (!Array.isArray(features)) features = []; // Додаткова перевірка
    } catch (e) { features = []; }

    let spellList: SpellList = { slots: {}, list: [] };
    try {
        spellList = JSON.parse(char.spells_json || '{"slots": {}, "list": []}');
        if (!Array.isArray(spellList.list)) spellList.list = []; 
    } catch (e) { spellList = { slots: {}, list: [] }; }
    
    let appearance: Record<string, string> = {};
    try {
        appearance = JSON.parse(char.appearance_json || '{}');
    } catch (e) { appearance = {}; }

    const defaultImageUrl = '/assets/default_hero.jpg';
    const imageUrl = char.image_url || defaultImageUrl;
    
    // >>> ПЕРЕТВОРЕННЯ ДЛЯ TEXTAREA (читабельний формат) <<<
    const featuresText = features.map(f => `[${f.name}]: ${f.description}`).join('\n\n');
    const spellListText = spellList.list.join('\n');
    const appearanceText = Object.entries(appearance)
        .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
        .join('\n');


    // Розрахунок похідних
    const initiative = formatModifier(calculateInitiative(char.dex));
    const passivePerception = calculatePassivePerception(
        char.wis, 
        char.level, 
        proficiencies.skills.includes('Perception')
    );
    
    // Характеристики для розрахунку бонусу атаки
    const abilityScores: Record<AbilityScore, number> = {
        str: char.str, dex: char.dex, con: char.con, int: char.int, wis: char.wis, cha: char.cha
    };
    
    // Рендеринг Характеристик
    const abilityScoreNames: AbilityScore[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const abilityScoresHtml = abilityScoreNames.map(scoreName => {
        const scoreValue = char[scoreName];
        return renderAbilityScore(scoreName, scoreValue, char.level, proficiencies);
    }).join('');

    // Рендеринг Зброї (Таблиця)
    const weaponsHtml = weapons.map((w, index) => {
        const attackScore = w.score || (abilityScores.str >= abilityScores.dex ? 'str' : 'dex');
        const attackValue = abilityScores[attackScore];
        
        let attackBonus = calculateModifier(attackValue);
        if (w.proficient) {
            attackBonus += pb;
        }

        return `
            <tr data-weapon-index="${index}">
                <td><input type="text" data-weapon-field="name" value="${escapeHtml(w.name)}" /></td>
                <td class="text-center"><span class="weapon-bonus">${formatModifier(attackBonus)}</span></td>
                <td><input type="text" data-weapon-field="damage" value="${escapeHtml(w.damage)}" /></td>
                <td>
                    <button type="button" class="btn--remove-weapon" data-weapon-index="${index}">X</button>
                </td>
                <input type="hidden" data-weapon-field="score" value="${attackScore}" />
                <input type="hidden" data-weapon-field="proficient" value="${w.proficient ? 'true' : 'false'}" />
            </tr>
        `;
    }).join('');

    // Рендеринг Капіталу (5 полів)
    const moneyOrder: ('gp' | 'sp' | 'cp' | 'pp' | 'ep')[] = ['gp', 'sp', 'cp', 'pp', 'ep'];
    const capitalHtml = moneyOrder.map(key => {
        const value = inventory.capital[key] || 0;
        return `
            <div class="money-item">
                <input type="number" data-money-key="${key}" value="${value}" />
                <label>${key.toUpperCase()}</label>
            </div>
        `;
    }).join('');

    // Рендеринг інших володінь (Other Proficiencies)
    const otherProficienciesText = proficiencies.other.join('\n');

    // Приховані поля для збереження володінь
    const initialSkills = proficiencies.skills.join(',');
    const initialSaves = proficiencies.saves.join(',');

    // HTML для слотів заклинань
    const spellSlotsHtml = Object.entries(spellList.slots)
        .map(([level, count]) => `
            <div class="spell-slot-item">
                <label>Lvl ${level.replace('level', '')}</label>
                <input type="number" data-spell-slot-lvl="${level}" value="${count}" />
            </div>
        `).join('');


    return layout({
        title: `${char.name} — Лист персонажа`,
        bodyClass: "character-sheet-page",
        body: `
<section class="character-sheet">
    <a href="/characters" class="btn btn--secondary btn--back">← До списку персонажів</a>

    <form method="POST" action="/character/${char.id}" id="characterSheetForm">
        <input type="hidden" name="id" value="${char.id}">
        
        <input type="hidden" id="proficient-skills" name="proficient_skills" value="${initialSkills}">
        <input type="hidden" id="proficient-saves" name="proficient_saves" value="${initialSaves}">
        <input type="hidden" name="weapons_json" id="weapons-json-input" value="${escapeHtml(JSON.stringify(weapons))}">
        <input type="hidden" name="inventory_json" id="inventory-json-input" value="${escapeHtml(JSON.stringify(inventory))}">
        <input type="hidden" name="features_json" id="features-json-input" value="${escapeHtml(JSON.stringify(features))}">
        <input type="hidden" name="spells_json" id="spells-json-input" value="${escapeHtml(JSON.stringify(spellList))}">
        <input type="hidden" name="appearance_json" id="appearance-json-input" value="${escapeHtml(JSON.stringify(appearance))}">
        <input type="hidden" name="image_url" id="image-url-input" value="${escapeHtml(imageUrl)}" />


        <header class="sheet-header">
            
            <div class="header__image-container">
                <div class="header__image">
                    <img src="${imageUrl}" alt="${escapeHtml(char.name)} Portrait" id="character-portrait" />
                    
                    <button type="button" class="btn--edit-image" id="toggle-image-edit">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                            <path d="M12 9a3 3 0 100 6 3 3 0 000-6z"/><path d="M19 2a3 3 0 013 3v14a3 3 0 01-3 3H5a3 3 0 01-3-3V5a3 3 0 013-3h14zm-1 2H6a1 1 0 00-1 1v14a1 1 0 001 1h12a1 1 0 001-1V5a1 1 0 00-1-1zM5 19l4-4 4 4z"/>
                        </svg>
                    </button>
                </div>
                <div class="image-edit-controls hidden" id="image-edit-controls">
                    <input type="text" id="image-url-editor" value="${escapeHtml(imageUrl)}" placeholder="Вставити URL зображення" />
                    <button type="button" id="save-image-url">Зберегти</button>
                </div>
            </div>

            <div class="header__main-info">
                <div class="header__name">
                    <input class="name-field input--name" name="name" value="${escapeHtml(char.name)}" />
                    <label class="name-label">Ім'я персонажа</label> 
                </div>
                
                <div class="header__details">
                    <div class="detail-group">
                        <span class="detail-label">Клас & Рівень</span>
                        <div class="detail-value">
                            <input class="input--inline" name="dnd_class" value="${escapeHtml(char.dnd_class)}" />
                            <input class="input--inline input--level" type="number" name="level" value="${char.level}" />
                        </div>
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Раса</span>
                        <input class="input--inline" name="race" value="${escapeHtml(char.race)}" />
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Передісторія</span>
                        <input class="input--inline" name="background" value="${escapeHtml(char.background)}" />
                    </div>
                    <div class="detail-group">
                        <span class="detail-label">Світогляд</span>
                        <input class="input--inline" name="alignment" value="${escapeHtml(char.alignment)}" />
                    </div>
                </div>
            </div>
        </header>

        <main class="sheet-main">
            
            <section class="column column--left">
                
                <div class="stat-item stat-item--pb">
                    <span class="stat-value" data-proficiency-bonus>${formatModifier(pb)}</span>
                    <label>Бонус Владання</label>
                </div>

                <div class="stat-item stat-item--inspiration-top">
                    <input type="checkbox" name="inspiration" value="1" ${char.inspiration ? 'checked' : ''} />
                    <label>Натхнення</label>
                </div>
                
                <h2>Характеристики та Навички</h2>
                <div class="ability-scores">
                    ${abilityScoresHtml}
                </div>

                <div class="passive-perception-block">
                    <span class="stat-value" data-passive-perception>${passivePerception}</span>
                    <label>Пасивне Сприйняття</label>
                </div>
            </section>

            <section class="column column--middle">
                
                <div class="combat-stats-top-row">
                    <div class="hp-block">
                        <div class="hp-item hp-item--max">
                            <label>Макс. ХП</label>
                            <input type="number" name="max_hp" value="${char.max_hp}" />
                        </div>
                        <div class="hp-item hp-item--current">
                            <label>Поточні ХП</label>
                            <input type="number" name="current_hp" value="${char.current_hp}" />
                        </div>
                        <div class="hp-item hp-item--temp">
                            <label>Тимчасові ХП</label>
                            <input type="number" name="temp_hp" value="${char.temp_hp}" />
                        </div>
                    </div>
                    
                    <div class="stat-block stat-block--combat">
                        <div class="stat-item stat-item--ac">
                            <input class="stat-value input--small" name="ac" type="number" value="${char.ac}" />
                            <label>Клас Захисту (КЗ)</label>
                        </div>
                        <div class="stat-item stat-item--initiative">
                            <span class="stat-value" data-initiative-mod>${initiative}</span>
                            <label>Ініціатива</label>
                        </div>
                        <div class="stat-item stat-item--speed">
                            <input class="stat-value input--small" name="speed" type="number" value="${char.speed}" />
                            <label>Швидкість</label>
                        </div>
                    </div>
                </div>
                
                <h2 class="h2--compact">Озброєння та Атаки</h2>
                <div class="weapons-table" data-weapons-table>
                    <table>
                        <thead>
                            <tr>
                                <th>Назва</th>
                                <th class="text-center">Бонус</th>
                                <th>Урон</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody data-weapons-body>
                            ${weaponsHtml}
                        </tbody>
                    </table>
                    <button type="button" class="btn--add-weapon">+ Додати зброю</button>
                    <p class="muted small text-center">Бонус розраховується автоматично (STR/DEX + PB).</p>
                </div>

                <h2 class="h2--compact">Інші Владання (Мови, Інструменти)</h2>
                <textarea class="textarea--short" name="proficiencies_other" placeholder="Список володінь, набори інструментів">${escapeHtml(otherProficienciesText)}</textarea>
                
                <h2 class="h2--compact">Особливості та Вміння</h2>
                <textarea class="textarea--tall" data-features-input name="features_text" placeholder="Формат: [Назва]: Опис. Кожна особливість з нового рядка.">${escapeHtml(featuresText)}</textarea>
                
                <h2 class="h2--compact">Заклинання</h2>
                <div class="spell-slots-block">
                    ${spellSlotsHtml}
                </div>
                <label class="small muted">Список заклинань (по одному на рядок):</label>
                <textarea class="textarea--tall" data-spells-list-input name="spells_list_text" placeholder="Fireball\nCure Wounds">${escapeHtml(spellListText)}</textarea>
            </section>

            <section class="column column--right">
                <h2 class="h2--compact">Риси та Рольова частина</h2>
                <div class="role-group">
                    <label>Риси Характеру</label>
                    <textarea name="personality_traits">${escapeHtml(char.personality_traits)}</textarea>
                </div>
                <div class="role-group">
                    <label>Ідеали</label>
                    <textarea name="ideals">${escapeHtml(char.ideals)}</textarea>
                </div>
                <div class="role-group">
                    <label>Прив'язаності</label>
                    <textarea name="bonds">${escapeHtml(char.bonds)}</textarea>
                </div>
                <div class="role-group">
                    <label>Недоліки</label>
                    <textarea name="flaws">${escapeHtml(char.flaws)}</textarea>
                </div>
                
                <h2 class="h2--compact">Спорядження та Капітал</h2>
                <div class="money-block">
                    ${capitalHtml}
                </div>
                <label class="small muted">Інші предмети (по одному на рядок):</label>
                <textarea class="textarea--tall" data-inventory-items name="inventory_items_list">${escapeHtml(inventory.items.join('\n'))}</textarea>

                
                <h2 class="h2--compact">Зовнішність</h2>
                <textarea class="textarea--tall" data-appearance-input name="appearance_text" placeholder="Зріст: 180см\nВага: 85кг\nКолір очей: Синій">${escapeHtml(appearanceText)}</textarea>

                <label class="small muted">Історія персонажа</label>
                <textarea class="textarea--tall" name="history_notes">${escapeHtml(char.history_notes)}</textarea>
            </section>
        </main>
        
        <footer class="sheet-footer">
            <button type="submit" class="btn btn--primary btn--save">Зберегти персонажа</button>
        </footer>
    </form>
</section>
        `
    });
}