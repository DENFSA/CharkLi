// D&D Utility Functions (Client-side calculations - Duplicated from dnd_utils.ts)
const ABILITY_SCORES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const SKILLS_MAP = {
    'Acrobatics': 'dex', 'Animal Handling': 'wis', 'Arcana': 'int', 
    'Athletics': 'str', 'Deception': 'cha', 'History': 'int', 
    'Insight': 'wis', 'Intimidation': 'cha', 'Investigation': 'int', 
    'Medicine': 'wis', 'Nature': 'int', 'Perception': 'wis', 
    'Performance': 'cha', 'Persuasion': 'cha', 'Religion': 'int', 
    'Sleight of Hand': 'dex', 'Stealth': 'dex', 'Survival': 'wis',
};

function calculateModifier(score) {
    return Math.floor((score - 10) / 2);
}

function getProficiencyBonus(level) {
    if (level >= 17) return 6;
    if (level >= 13) return 5;
    if (level >= 9) return 4;
    if (level >= 5) return 3;
    return 2;
}

function formatModifier(modifier) {
    return modifier >= 0 ? `+${modifier}` : String(modifier);
}

function calculateSaveThrow(scoreValue, level, isProficient) {
    let mod = calculateModifier(scoreValue);
    if (isProficient) {
        mod += getProficiencyBonus(level);
    }
    return mod;
}

function calculateSkillBonus(abilityScoreValue, level, isProficient) {
    let mod = calculateModifier(abilityScoreValue);
    if (isProficient) {
        mod += getProficiencyBonus(level);
    }
    return mod;
}

function calculatePassivePerception(wisScore, level, isProficient) {
    const perceptionBonus = calculateSkillBonus(wisScore, level, isProficient);
    return 10 + perceptionBonus;
}

// ====================================================
// MAIN DOM LOGIC
// ====================================================

document.addEventListener("DOMContentLoaded", () => {
    // ----------------------------------------------------
    // Логіка перемикання Вхід/Реєстрація (існуюча логіка)
    // ----------------------------------------------------
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");

    if (login && register) {
        document.querySelectorAll("[data-switch]").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.dataset.switch === "register") {
                    login.classList.add("hidden");
                    register.classList.remove("hidden");
                } else {
                    register.classList.add("hidden");
                    login.classList.remove("hidden");
                }
            });
        });
    }

    // ----------------------------------------------------
    // Логіка Листа Персонажа
    // ----------------------------------------------------

    const characterSheet = document.querySelector('.character-sheet');
    if (characterSheet) {
        
        const abilityInputs = document.querySelectorAll('[data-score-input]');
        const levelInput = document.querySelector('.input--level');
        const proficiencyCheckboxes = document.querySelectorAll('[data-proficiency-toggle]');
        
        // Приховані поля для збереження профіцитів та JSON
        const skillsHiddenInput = document.getElementById('proficient-skills');
        const savesHiddenInput = document.getElementById('proficient-saves');
        const weaponsJsonInput = document.getElementById('weapons-json-input');
        const inventoryJsonInput = document.getElementById('inventory-json-input');
        const featuresJsonInput = document.getElementById('features-json-input');
        const spellsJsonInput = document.getElementById('spells-json-input'); 
        const appearanceJsonInput = document.getElementById('appearance-json-input'); 
        const imageUrlInput = document.getElementById('image-url-input');


        let charLevel = parseInt(levelInput?.value) || 1;
        
        // Отримуємо поточний стан володінь з прихованих полів
        let proficientSkills = skillsHiddenInput.value ? skillsHiddenInput.value.split(',').filter(s => s.length > 0) : [];
        let proficientSaves = savesHiddenInput.value ? savesHiddenInput.value.split(',').filter(s => s.length > 0) : [];
        
        // Функція для перевірки володіння
        function isProficient(name, type) {
            if (type === 'save') return proficientSaves.includes(name);
            if (type === 'skill') return proficientSkills.includes(name);
            return false;
        }

        // ----------------------------------------------------
        // ЛОГІКА ПЕРЕРАХУНКУ СТАТІВ ТА НАВИЧОК (Run on input)
        // ----------------------------------------------------
        function updateCharacterSheet() {
            const currentScores = {};
            
            // 1. Збираємо поточні значення характеристик і оновлюємо модифікатори
            abilityInputs.forEach(input => {
                const scoreName = input.dataset.scoreInput;
                const scoreValue = parseInt(input.value) || 10; 
                currentScores[scoreName] = scoreValue;
                
                const mod = calculateModifier(scoreValue);
                const modFormatted = formatModifier(mod);

                const modElement = input.closest('.ability-score').querySelector(`[data-ability-mod="${scoreName}"]`);
                if(modElement) modElement.textContent = modFormatted;

                // 2. Оновлюємо Спасбросок
                const isSaveProficient = isProficient(scoreName, 'save');
                const saveBonus = calculateSaveThrow(scoreValue, charLevel, isSaveProficient);
                const saveBonusElement = input.closest('.ability-score').querySelector(`[data-save-bonus="${scoreName}"]`);
                if(saveBonusElement) saveBonusElement.textContent = formatModifier(saveBonus);
            });
            
            // 3. Оновлюємо Навички
            document.querySelectorAll('.skill-row').forEach(skillRow => {
                const skillBonusElement = skillRow.querySelector('.skill-row__bonus');
                const skillName = skillBonusElement.dataset.skillBonus; 
                
                if (skillName) {
                    const baseAbility = SKILLS_MAP[skillName];
                    if (baseAbility) {
                        const scoreValue = currentScores[baseAbility] || 10;
                        const isSkillProficient = isProficient(skillName, 'skill');
                        const skillBonus = calculateSkillBonus(scoreValue, charLevel, isSkillProficient);

                        skillBonusElement.textContent = formatModifier(skillBonus);
                    }
                }
            });

            // 4. Оновлюємо Ініціативу
            const initiativeMod = calculateModifier(currentScores.dex || 10);
            const initiativeElement = document.querySelector('[data-initiative-mod]');
            if(initiativeElement) initiativeElement.textContent = formatModifier(initiativeMod);

            // 5. Оновлюємо Пасивне Сприйняття
            const isPerceptionProficient = isProficient('Perception', 'skill');
            const passivePerception = calculatePassivePerception(currentScores.wis || 10, charLevel, isPerceptionProficient);
            const passivePerceptionElement = document.querySelector('[data-passive-perception]');
            if(passivePerceptionElement) passivePerceptionElement.textContent = passivePerception;
            
            // 6. Оновлюємо бонуси атаки для зброї
            updateWeaponBonuses(currentScores);
        }
        
        // ----------------------------------------------------
        // ЛОГІКА ПАКУВАННЯ JSON (Run on form submit or item input)
        // ----------------------------------------------------

        // --- Weapons JSON Packing ---
        const weaponRowsContainer = document.querySelector('[data-weapons-body]');
        
        function updateWeaponBonuses(scores) {
            const pb = getProficiencyBonus(charLevel);
            document.querySelectorAll('[data-weapons-body] tr').forEach(row => {
                const scoreInput = row.querySelector('input[data-weapon-field="score"]');
                const profInput = row.querySelector('input[data-weapon-field="proficient"]');
                const bonusSpan = row.querySelector('.weapon-bonus');
                
                if (scoreInput && profInput && bonusSpan) {
                    const scoreName = scoreInput.value;
                    const isProf = profInput.value === 'true';
                    const scoreValue = scores[scoreName] || 10;
                    
                    let bonus = calculateModifier(scoreValue);
                    if (isProf) {
                        bonus += pb;
                    }
                    bonusSpan.textContent = formatModifier(bonus);
                }
            });
        }
        
        function compileWeaponsJson() {
            const weaponsArray = [];
            document.querySelectorAll('[data-weapons-body] tr').forEach(row => {
                const nameInput = row.querySelector('input[data-weapon-field="name"]');
                const damageInput = row.querySelector('input[data-weapon-field="damage"]');
                const scoreInput = row.querySelector('input[data-weapon-field="score"]');
                const profInput = row.querySelector('input[data-weapon-field="proficient"]');

                if (nameInput?.value.trim() !== "") {
                     weaponsArray.push({
                         name: nameInput.value.trim(),
                         damage: damageInput.value.trim(),
                         score: scoreInput.value,
                         proficient: profInput.value === 'true'
                     });
                }
            });
            if (weaponsJsonInput) {
                weaponsJsonInput.value = JSON.stringify(weaponsArray);
            }
        }
        
        if (weaponRowsContainer) {
            weaponRowsContainer.addEventListener('input', compileWeaponsJson);
            
            // Логіка додавання/видалення рядків
            document.querySelector('.btn--add-weapon')?.addEventListener('click', () => {
                const newIndex = document.querySelectorAll('[data-weapons-body] tr').length;
                const newRow = `
                    <tr data-weapon-index="${newIndex}">
                        <td><input type="text" data-weapon-field="name" value="New Weapon" /></td>
                        <td class="text-center"><span class="weapon-bonus">+0</span></td>
                        <td><input type="text" data-weapon-field="damage" value="1d4 piercing" /></td>
                        <td><button type="button" class="btn--remove-weapon" data-weapon-index="${newIndex}">X</button></td>
                        <input type="hidden" data-weapon-field="score" value="str" />
                        <input type="hidden" data-weapon-field="proficient" value="false" />
                    </tr>
                `;
                weaponRowsContainer.insertAdjacentHTML('beforeend', newRow);
                compileWeaponsJson(); 
                updateCharacterSheet();
            });

            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn--remove-weapon')) {
                    e.target.closest('tr').remove();
                    compileWeaponsJson();
                }
            });
        }


        // --- Inventory JSON Packing ---
        const inventoryItemsTextarea = document.querySelector('[data-inventory-items]');
        const moneyInputs = document.querySelectorAll('.money-block input[type="number"]');

        function compileInventoryJson() {
            const capital = {};
            moneyInputs.forEach(input => {
                const key = input.dataset.moneyKey;
                capital[key] = parseInt(input.value) || 0;
            });

            const items = inventoryItemsTextarea.value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);
                
            const newInventory = { items, capital };
            
            if (inventoryJsonInput) {
                 inventoryJsonInput.value = JSON.stringify(newInventory);
            }
        }

        if (inventoryItemsTextarea) {
            inventoryItemsTextarea.addEventListener('input', compileInventoryJson);
            moneyInputs.forEach(input => input.addEventListener('input', compileInventoryJson));
            
            document.querySelector('#characterSheetForm').addEventListener('submit', compileInventoryJson);
        }
        
        // --- Features JSON Packing ---
        const featuresInput = document.querySelector('[data-features-input]');
        
        function compileFeaturesJson() {
            if (!featuresInput || !featuresJsonInput) return;
            
            const lines = featuresInput.value.split('\n');
            const newFeatures = [];
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;
                
                // Простий парсинг: [Назва]: Опис
                const match = trimmedLine.match(/^\[(.*?)\]:\s*(.*)/);
                
                if (match) {
                    newFeatures.push({
                        name: match[1].trim(),
                        description: match[2].trim()
                    });
                } else {
                    // Якщо формат не підійшов, використовуємо весь рядок як опис
                    newFeatures.push({
                        name: 'Опис',
                        description: trimmedLine
                    });
                }
            });

            featuresJsonInput.value = JSON.stringify(newFeatures);
        }

        if (featuresInput) {
            featuresInput.addEventListener('input', compileFeaturesJson);
        }

        // --- Spells JSON Packing ---
        const spellsListInput = document.querySelector('[data-spells-list-input]');
        const spellSlotsInputs = document.querySelectorAll('[data-spell-slot-lvl]');
        
        function compileSpellsJson() {
            if (!spellsJsonInput || !spellsListInput) return;

            const newSpellList = {
                slots: {},
                list: []
            };

            // Збір слотів
            spellSlotsInputs.forEach(input => {
                const level = input.dataset.spellSlotLvl;
                newSpellList.slots[level] = parseInt(input.value) || 0;
            });

            // Збір списку заклинань
            newSpellList.list = spellsListInput.value
                .split('\n')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            spellsJsonInput.value = JSON.stringify(newSpellList);
        }

        if (spellsListInput) {
            spellsListInput.addEventListener('input', compileSpellsJson);
            spellSlotsInputs.forEach(input => input.addEventListener('input', compileSpellsJson));
        }

        // --- Appearance JSON Packing ---
        const appearanceInput = document.querySelector('[data-appearance-input]');
        
        function compileAppearanceJson() {
            if (!appearanceInput || !appearanceJsonInput) return;
            
            const lines = appearanceInput.value.split('\n');
            const newAppearance = {};
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;
                
                // Парсинг: Ключ: Значення
                const parts = trimmedLine.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim().toLowerCase();
                    const value = parts.slice(1).join(':').trim();
                    if (key) {
                        newAppearance[key] = value;
                    }
                }
            });

            appearanceJsonInput.value = JSON.stringify(newAppearance);
        }

        if (appearanceInput) {
            appearanceInput.addEventListener('input', compileAppearanceJson);
        }
        
        // --- Image URL Editing Logic ---
        const imageToggleBtn = document.getElementById('toggle-image-edit');
        const imageEditControls = document.getElementById('image-edit-controls');
        const imageUrlEditor = document.getElementById('image-url-editor');
        const saveImageUrlBtn = document.getElementById('save-image-url');
        const characterPortrait = document.getElementById('character-portrait');

        if (imageToggleBtn && imageEditControls) {
            
            // 1. Показати/приховати редактор
            imageToggleBtn.addEventListener('click', () => {
                imageEditControls.classList.toggle('hidden');
                imageUrlEditor.focus();
            });

            // 2. Зберегти URL та оновити зображення
            saveImageUrlBtn.addEventListener('click', () => {
                const newUrl = imageUrlEditor.value.trim();
                // Оновлюємо візуальне зображення
                characterPortrait.src = newUrl || '/assets/default_hero.jpg';
                // Оновлюємо приховане поле форми для збереження в базу
                imageUrlInput.value = newUrl; 
                
                imageEditControls.classList.add('hidden');
            });
            
            // 3. Оновлення URL при введенні в поле
            imageUrlEditor.addEventListener('input', () => {
                // Це дає миттєвий попередній перегляд
                characterPortrait.src = imageUrlEditor.value.trim() || '/assets/default_hero.jpg'; 
            });
        }


        // ----------------------------------------------------
        // ПРИВ'ЯЗКА ОСНОВНИХ ОБРОБНИКІВ та ІНІЦІАЛІЗАЦІЯ
        // ----------------------------------------------------

        // Обробник кліку по чекбоксу володіння
        proficiencyCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target;
                const type = target.dataset.proficiencyToggle;
                const name = target.dataset.proficiencyName;
                
                if (type === 'skill') {
                    if (target.checked) {
                        if (!proficientSkills.includes(name)) proficientSkills.push(name);
                    } else {
                        proficientSkills = proficientSkills.filter(s => s !== name);
                    }
                    skillsHiddenInput.value = proficientSkills.join(',');
                } else if (type === 'save') {
                    if (target.checked) {
                        if (!proficientSaves.includes(name)) proficientSaves.push(name);
                    } else {
                        proficientSaves = proficientSaves.filter(s => s !== name);
                    }
                    savesHiddenInput.value = proficientSaves.join(',');
                }
                
                updateCharacterSheet();
            });
        });

        // Прив'язка обробників вводу характеристик
        abilityInputs.forEach(input => {
            input.addEventListener('input', updateCharacterSheet);
            input.addEventListener('blur', () => {
                if (parseInt(input.value) < 1 || input.value.trim() === '') {
                    input.value = 10; 
                }
                updateCharacterSheet();
            });
        });

        // Ініціалізація: перший запуск для відображення динамічних значень
        updateCharacterSheet(); 
        compileWeaponsJson(); 
        compileInventoryJson();
        compileFeaturesJson(); 
        compileSpellsJson(); 
        compileAppearanceJson(); 
    }
});