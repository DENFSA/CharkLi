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
    
    image_url: string;
}

interface Proficiencies {
    skills: string[];
    saves: AbilityScore[];
    other: string[];
}

// >>> НОВІ ІНТЕРФЕЙСИ ДЛЯ СТРУКТУРОВАНИХ ДАНИХ <<<
interface Weapon {
    name: string;
    damage: string;
    type: string;
    score: AbilityScore; // Базова характеристика для атаки
    proficient: boolean; // Чи володіє персонаж
}

interface Inventory {
    items: string[];
    capital: Record<string, number>; 
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
    // Встановлюємо default, якщо дані порожні
    const weapons: Weapon[] = JSON.parse(char.weapons_json || '[{"name":"Longsword", "damage":"1d8", "type":"slashing", "score":"str", "proficient": true}]');
    const inventory: Inventory = JSON.parse(char.inventory_json || '{"items": ["Chain Mail", "Shield"], "capital": {"gp": 10, "sp": 0, "cp": 0}}');
    const appearance: Record<string, string> = JSON.parse(char.appearance_json || '{}');
    
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
        // Визначаємо, яка характеристика сильніша (STR чи DEX)
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

    // Рендеринг Капіталу (4 поля)
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

        <header class="sheet-header">
            <div class="header__name">
                <input class="name-field input--name" name="name" value="${escapeHtml(char.name)}" />
                <label>Ім'я персонажа</label>
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
                <textarea class="textarea--tall" name="features_json" placeholder="JSON особливостей">${escapeHtml(char.features_json)}</textarea>
                
                <h2 class="h2--compact">Заклинання</h2>
                <textarea class="textarea--tall" name="spells_json" placeholder="JSON заклинань">${escapeHtml(char.spells_json)}</textarea>
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
                <textarea class="textarea--tall" name="appearance_json" placeholder="Зріст, вага, колір очей і т.д. (JSON)">${escapeHtml(char.appearance_json)}</textarea>

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