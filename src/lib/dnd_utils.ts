// CharkLi/src/lib/dnd_utils.ts

export const ABILITY_SCORES = [
    'str', 'dex', 'con', 'int', 'wis', 'cha'
] as const;
export type AbilityScore = typeof ABILITY_SCORES[number];

// Співставлення навичок з їхньою базовою характеристикою
export const SKILLS_MAP: Record<string, AbilityScore> = {
    'Acrobatics': 'dex',
    'Animal Handling': 'wis',
    'Arcana': 'int',
    'Athletics': 'str',
    'Deception': 'cha',
    'History': 'int',
    'Insight': 'wis',
    'Intimidation': 'cha',
    'Investigation': 'int',
    'Medicine': 'wis',
    'Nature': 'int',
    'Perception': 'wis',
    'Performance': 'cha',
    'Persuasion': 'cha',
    'Religion': 'int',
    'Sleight of Hand': 'dex',
    'Stealth': 'dex',
    'Survival': 'wis',
};

// =======================================================
// БАЗОВІ ФУНКЦІЇ
// =======================================================

/**
 * Рахує модифікатор характеристики.
 * Формула: Math.floor((score - 10) / 2)
 */
export function calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}

/**
 * Рахує Бонус Владання (Proficiency Bonus) на основі рівня.
 */
export function getProficiencyBonus(level: number): number {
    if (level < 1) return 0;
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
}

/**
 * Форматує модифікатор з плюсом, якщо він позитивний.
 */
export function formatModifier(modifier: number): string {
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}


// =======================================================
// РОЗРАХУНОК ПОХІДНИХ ПОКАЗНИКІВ
// =======================================================

/**
 * Рахує бонус для кидка на спасбросок.
 * @param scoreValue - Значення характеристики (наприклад, 14 DEX).
 * @param level - Рівень персонажа.
 * @param isProficient - Чи володіє персонаж цим спасброском.
 * @returns Модифікатор кидка на спасбросок.
 */
export function calculateSaveThrow(
    scoreValue: number, 
    level: number, 
    isProficient: boolean
): number {
    let mod = calculateModifier(scoreValue);
    if (isProficient) {
        mod += getProficiencyBonus(level);
    }
    return mod;
}

/**
 * Рахує бонус для навички.
 * @param abilityScoreValue - Значення базової характеристики навички.
 * @param level - Рівень персонажа.
 * @param proficiencyType - Тип володіння ('none', 'half' (Jack of All Trades), 'proficient', 'expertise').
 * @returns Модифікатор навички.
 */
export function calculateSkillBonus(
    abilityScoreValue: number, 
    level: number, 
    proficiencyType: 'none' | 'proficient' | 'expertise' = 'none'
): number {
    let mod = calculateModifier(abilityScoreValue);
    const pb = getProficiencyBonus(level);
    
    if (proficiencyType === 'proficient') {
        mod += pb;
    } else if (proficiencyType === 'expertise') {
        mod += (pb * 2);
    }
    // Примітка: 'half' (Jack of All Trades) тут не реалізовано для спрощення, 
    // але його можна додати: mod += Math.floor(pb / 2);
    
    return mod;
}

/**
 * Рахує Ініціативу. Це просто модифікатор DEX.
 */
export function calculateInitiative(dexScore: number): number {
    return calculateModifier(dexScore);
}

/**
 * Рахує Пасивне Сприйняття.
 * Формула: 10 + Perception Skill Bonus.
 * @param wisScore - Значення WIS.
 * @param level - Рівень персонажа.
 * @param isProficient - Чи володіє Perception.
 * @returns Значення пасивного сприйняття.
 */
export function calculatePassivePerception(
    wisScore: number, 
    level: number, 
    isProficient: boolean
): number {
    const perceptionBonus = calculateSkillBonus(
        wisScore, 
        level, 
        isProficient ? 'proficient' : 'none'
    );
    return 10 + perceptionBonus;
}

/**
 * Рахує Бонус Попадання (Attack Bonus) для Зброї, яка використовує STR або DEX.
 * Формула: PB + Модифікатор (STR або DEX).
 * @param primaryScoreValue - Значення STR або DEX, яке використовується для атаки.
 * @param level - Рівень персонажа.
 * @param isProficient - Чи володіє персонаж цією зброєю.
 * @returns Бонус попадання.
 */
export function calculateAttackBonus(
    primaryScoreValue: number, 
    level: number, 
    isProficient: boolean
): number {
    let mod = calculateModifier(primaryScoreValue);
    if (isProficient) {
        mod += getProficiencyBonus(level);
    }
    return mod;
}