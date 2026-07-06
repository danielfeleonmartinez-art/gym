// ===== NUTRITION PAGE =====
const NutritionPage = {
    activeTab: 'plan',
    deficitLevel: localStorage.getItem('fitai_deficit_level') || 'moderado', // leve, moderado, agresivo, superavit_leve, superavit_moderado

    render() {
        const profile = Storage.getProfile();
        const macros = this.calculateMacros(profile);

        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;"> Nutrición</h2>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab ${this.activeTab === 'plan' ? 'active' : ''}" onclick="NutritionPage.setTab('plan')">Mi Plan</button>
                <button class="tab ${this.activeTab === 'meals' ? 'active' : ''}" onclick="NutritionPage.setTab('meals')">Comidas</button>
                <button class="tab ${this.activeTab === 'tips' ? 'active' : ''}" onclick="NutritionPage.setTab('tips')">Consejos</button>
            </div>

            ${this.activeTab === 'plan' ? this.renderPlan(macros, profile) : ''}
            ${this.activeTab === 'meals' ? this.renderMeals(macros, profile) : ''}
            ${this.activeTab === 'tips' ? this.renderTips(profile) : ''}
        </div>`;
    },

    renderPlan(macros, profile) {
        const todayLog = this.getTodayLog();
        const consumed = todayLog.reduce((sum, entry) => ({
            calories: sum.calories + (entry.calories || 0),
            protein: sum.protein + (entry.protein || 0),
            carbs: sum.carbs + (entry.carbs || 0),
            fats: sum.fats + (entry.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

        return `
            <!-- Deficit/Surplus Level Selector -->
            <div class="card mb-3">
                <h3 class="card-title mb-1"> Nivel de ${(profile.goal || '').includes('perder') || (profile.goal || '').includes('definir') ? 'Déficit' : 'Superávit'}</h3>
                <p class="text-muted mb-2" style="font-size: 0.75rem;">Elige qué tan agresivo quieres ser. La IA ajusta todo automáticamente.</p>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn btn-sm ${this.deficitLevel === 'leve' ? 'btn-success' : 'btn-secondary'}" style="flex:1;" onclick="NutritionPage.setDeficitLevel('leve')">
                        🐢 Leve
                    </button>
                    <button class="btn btn-sm ${this.deficitLevel === 'moderado' ? 'btn-primary' : 'btn-secondary'}" style="flex:1;" onclick="NutritionPage.setDeficitLevel('moderado')">
                         Moderado
                    </button>
                    <button class="btn btn-sm ${this.deficitLevel === 'agresivo' ? 'btn-danger' : 'btn-secondary'}" style="flex:1;" onclick="NutritionPage.setDeficitLevel('agresivo')">
                         Agresivo
                    </button>
                </div>
                ${macros.deficitInfo ? `
                <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--bg-input); border-radius: 8px;">
                    <p style="font-weight: 600; font-size: 0.85rem;">${macros.deficitInfo.name}</p>
                    <p class="text-muted" style="font-size: 0.75rem; margin-top: 0.2rem;">${macros.deficitInfo.desc}</p>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.7rem;">
                        <span style="color: var(--accent);">📉 ${macros.deficitInfo.rate}</span>
                        <span style="color: var(--text-muted);">⏱️ ${macros.deficitInfo.duration}</span>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Daily Target -->
            <div class="card mb-3" style="text-align: center; border-color: var(--primary);">
                <p style="font-size: 0.7rem; color: var(--text-muted);">TDEE: ${macros.tdee || '?'} kcal → Objetivo:</p>
                <p style="font-size: 2.2rem; font-weight: 800; color: var(--primary);">${macros.calories}</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary);">kcal / día</p>
                <p class="text-muted mt-1" style="font-size: 0.75rem;">Meta: ${profile.goal || 'mejorar composición corporal'}</p>
            </div>

            <!-- Macro Cards -->
            <div class="macro-grid">
                <div class="macro-card">
                    <div class="macro-icon">🥩</div>
                    <div class="macro-value" style="color: var(--secondary);">${macros.protein}g</div>
                    <div class="macro-label">Proteína</div>
                    <div class="macro-bar"><div class="macro-bar-fill" style="width: ${Math.min(consumed.protein/macros.protein*100, 100)}%; background: var(--secondary);"></div></div>
                </div>
                <div class="macro-card">
                    <div class="macro-icon">🍚</div>
                    <div class="macro-value" style="color: var(--accent);">${macros.carbs}g</div>
                    <div class="macro-label">Carbos</div>
                    <div class="macro-bar"><div class="macro-bar-fill" style="width: ${Math.min(consumed.carbs/macros.carbs*100, 100)}%; background: var(--accent);"></div></div>
                </div>
                <div class="macro-card">
                    <div class="macro-icon">🥑</div>
                    <div class="macro-value" style="color: var(--warning);">${macros.fats}g</div>
                    <div class="macro-label">Grasas</div>
                    <div class="macro-bar"><div class="macro-bar-fill" style="width: ${Math.min(consumed.fats/macros.fats*100, 100)}%; background: var(--warning);"></div></div>
                </div>
            </div>

            <!-- Log Food -->
            <div class="card mb-3">
                <h3 class="card-title mb-2">➕ Registrar Comida</h3>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Calorías</label>
                        <input type="number" class="form-input" id="food-cals" placeholder="500">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Proteína (g)</label>
                        <input type="number" class="form-input" id="food-protein" placeholder="30">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Carbos (g)</label>
                        <input type="number" class="form-input" id="food-carbs" placeholder="60">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Grasas (g)</label>
                        <input type="number" class="form-input" id="food-fats" placeholder="15">
                    </div>
                </div>
                <input type="text" class="form-input mb-2" id="food-name" placeholder="Descripción (ej: Pollo con arroz)">
                <button class="btn btn-success btn-full" onclick="NutritionPage.logFood()">
                    ✓ Registrar
                </button>
            </div>

            <!-- Today's Log -->
            <div class="section-header">
                <span class="section-title"> Hoy (${consumed.calories}/${macros.calories} kcal)</span>
            </div>
            ${todayLog.length === 0 ? `
                <p class="text-muted text-center" style="padding: 1rem;">No has registrado comidas hoy</p>
            ` : todayLog.map(entry => `
                <div class="meal-card">
                    <div class="meal-header">
                        <span class="meal-title">${entry.name || 'Comida'}</span>
                        <span class="meal-cals">${entry.calories} kcal</span>
                    </div>
                    <div class="meal-foods">P: ${entry.protein}g | C: ${entry.carbs}g | G: ${entry.fats}g</div>
                </div>
            `).join('')}

            <!-- Water Tracker -->
            <div class="card mt-3">
                <div class="flex justify-between items-center">
                    <span class="card-title">💧 Agua</span>
                    <span style="font-weight: 600; color: var(--accent);">${this.getWaterCount()}/8 vasos</span>
                </div>
                <div class="flex gap-1 mt-2" style="flex-wrap: wrap;">
                    ${Array.from({length: 8}, (_, i) => `
                        <button onclick="NutritionPage.addWater()" style="font-size: 1.5rem; background: none; border: none; cursor: pointer; opacity: ${i < this.getWaterCount() ? '1' : '0.3'};">💧</button>
                    `).join('')}
                </div>
            </div>

            <!-- Calories Burned Today -->
            <div class="card mt-3">
                <div class="flex justify-between items-center">
                    <span class="card-title"> Calorías Quemadas Hoy</span>
                    <span style="font-weight: 700; color: var(--secondary);">${this.getCaloriesBurned()} kcal</span>
                </div>
                <div class="progress-bar mt-1" style="height: 8px;">
                    <div class="progress-fill" style="width: ${Math.min(this.getCaloriesBurned() / 500 * 100, 100)}%; background: var(--secondary);"></div>
                </div>
                <p class="text-muted mt-1" style="font-size: 0.7rem;">Basado en tus entrenamientos registrados hoy</p>
            </div>
        `;
    },

    renderMeals(macros, profile) {
        const mealPlan = this.generateMealPlan(macros, profile);

        return `
            <div class="card mb-2" style="border-color: var(--accent);">
                <p style="font-size: 0.85rem; color: var(--accent);">💡 Plan de comidas basado en ${macros.calories} kcal/día</p>
            </div>

            ${mealPlan.map(meal => `
                <div class="meal-card">
                    <div class="meal-header">
                        <span class="meal-title">${meal.icon} ${meal.name}</span>
                        <span class="meal-cals">${meal.calories} kcal</span>
                    </div>
                    <div class="meal-foods">${meal.foods}</div>
                    <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">
                        P: ${meal.protein}g | C: ${meal.carbs}g | G: ${meal.fats}g
                    </div>
                </div>
            `).join('')}

            <div class="card mt-3">
                <h3 class="card-title mb-1">🛒 Lista de Compras Semanal</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                    <p>🥩 <strong>Proteínas:</strong> Pechuga de pollo, atún, huevos, yogur griego, whey</p>
                    <p>🍚 <strong>Carbos:</strong> Arroz, avena, pasta integral, patata, plátano</p>
                    <p>🥑 <strong>Grasas:</strong> Aceite de oliva, aguacate, frutos secos, mantequilla de maní</p>
                    <p>🥦 <strong>Verduras:</strong> Brócoli, espinacas, tomate, cebolla, pimiento</p>
                    <p>🍎 <strong>Frutas:</strong> Plátano, manzana, fresas, arándanos</p>
                </div>
            </div>
        `;
    },

    renderTips(profile) {
        const goal = profile.goal || 'ganar músculo';

        return `
            <div class="card mb-2">
                <h3 class="card-title mb-1"> Tips según tu objetivo: ${goal}</h3>
                ${goal.includes('perder') || goal.includes('definir') ? `
                    <ul style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8; list-style: none;">
                        <li> Déficit de 300-500 kcal (no más, pierdes músculo)</li>
                        <li>🥩 Proteína MÁS alta en déficit: 2.2-2.5g/kg</li>
                        <li>🚶 Aumenta NEAT (pasos diarios) en vez de bajar más calorías</li>
                        <li>🍽️ Come más volumen con pocas calorías (verduras, proteína magra)</li>
                        <li>⏰ No hagas cardio excesivo, prioriza pesas</li>
                        <li> Pésate a diario pero mira la MEDIA semanal</li>
                        <li> Cada 8-12 semanas haz una semana de mantenimiento</li>
                    </ul>
                ` : `
                    <ul style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8; list-style: none;">
                        <li> Superávit de 200-350 kcal (lean bulk, no te infles)</li>
                        <li>🥩 Proteína: 1.8-2.2g/kg es suficiente</li>
                        <li>🍚 Carbos ALTOS especialmente pre y post entreno</li>
                        <li>⏰ Come cada 3-4h para optimizar síntesis proteica</li>
                        <li>🌙 Caseína o yogur griego antes de dormir</li>
                        <li>💧 Hidrátate mucho (afecta rendimiento)</li>
                        <li> Objetivo: +0.25-0.5kg/semana (más = grasa)</li>
                    </ul>
                `}
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">⏰ Timing de Nutrientes</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                    <p><strong>Pre-entreno (1-2h antes):</strong> Carbos + Proteína moderada</p>
                    <p><strong>Intra-entreno:</strong> Agua + electrolitos (si >90min)</p>
                    <p><strong>Post-entreno (0-2h):</strong> Proteína rápida + Carbos altos</p>
                    <p><strong>Antes de dormir:</strong> Proteína lenta (caseína/yogur)</p>
                </div>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">❌ Errores Comunes</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                    <p>• No comer suficiente proteína en cada comida</p>
                    <p>• Saltarse comidas pensando que es mejor</p>
                    <p>• Eliminar grasas completamente (necesitas hormonas)</p>
                    <p>• No pesar/medir la comida (subestimas calorías)</p>
                    <p>• Ser demasiado restrictivo (no sostenible)</p>
                    <p>• No beber agua suficiente</p>
                </div>
            </div>

            <button class="btn btn-primary btn-full" onclick="App.navigate('ai-coach'); setTimeout(() => AICoachPage.quickPrompt('Dame un plan nutricional detallado para hoy'), 300);">
                🤖 Pedir Plan Detallado a IA
            </button>
        `;
    },

    // Helpers
    calculateMacros(profile) {
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const age = profile.age || 25;
        const gender = profile.gender || 'hombre';
        const goal = profile.goal || 'ganar músculo';
        const level = this.deficitLevel;

        // Calculate TDEE using Mifflin-St Jeor
        let bmr;
        if (gender === 'hombre') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }
        const tdee = Math.round(bmr * 1.55); // moderately active

        // Apply deficit/surplus based on selection
        let calories, protein, carbs, fats, deficitInfo;

        if (goal.includes('perder') || goal.includes('definir') || goal.includes('bajar')) {
            switch(level) {
                case 'leve':
                    calories = Math.round(tdee - 250);
                    deficitInfo = { name: 'Déficit Leve', desc: '-250 kcal. Pérdida lenta pero sostenible. Preserva más músculo.', rate: '0.25-0.3 kg/semana', duration: 'Ideal para 16-20+ semanas' };
                    break;
                case 'moderado':
                    calories = Math.round(tdee - 450);
                    deficitInfo = { name: 'Déficit Moderado', desc: '-450 kcal. Balance entre velocidad y preservación muscular.', rate: '0.4-0.6 kg/semana', duration: 'Ideal para 10-16 semanas' };
                    break;
                case 'agresivo':
                    calories = Math.round(tdee - 700);
                    deficitInfo = { name: 'Déficit Agresivo', desc: '-700 kcal. Rápido pero más riesgo de perder músculo. Solo corto plazo.', rate: '0.7-1 kg/semana', duration: 'MÁXIMO 6-8 semanas, luego sube a moderado' };
                    break;
                default:
                    calories = Math.round(tdee - 450);
                    deficitInfo = { name: 'Déficit Moderado', desc: '-450 kcal', rate: '0.5 kg/semana', duration: '10-16 semanas' };
            }
            protein = Math.round(weight * (level === 'agresivo' ? 2.4 : level === 'moderado' ? 2.2 : 2.0));
            fats = Math.round(weight * (level === 'agresivo' ? 0.7 : 0.9));
        } else if (goal.includes('ganar') || goal.includes('volumen') || goal.includes('músculo')) {
            switch(level) {
                case 'superavit_leve':
                case 'leve':
                    calories = Math.round(tdee + 200);
                    deficitInfo = { name: 'Superávit Lean', desc: '+200 kcal. Ganancia lenta minimizando grasa.', rate: '+0.2-0.3 kg/semana', duration: 'Ideal para 16-24 semanas' };
                    break;
                case 'superavit_moderado':
                case 'moderado':
                    calories = Math.round(tdee + 350);
                    deficitInfo = { name: 'Superávit Moderado', desc: '+350 kcal. Buen balance músculo/grasa.', rate: '+0.35-0.5 kg/semana', duration: 'Ideal para 12-20 semanas' };
                    break;
                case 'agresivo':
                    calories = Math.round(tdee + 500);
                    deficitInfo = { name: 'Superávit Agresivo', desc: '+500 kcal. Máxima ganancia pero algo de grasa extra.', rate: '+0.5-0.75 kg/semana', duration: 'Para ectomorfos o principiantes 12-16 semanas' };
                    break;
                default:
                    calories = Math.round(tdee + 300);
                    deficitInfo = { name: 'Superávit Moderado', desc: '+300 kcal', rate: '+0.35 kg/semana', duration: '12-20 semanas' };
            }
            protein = Math.round(weight * 2);
            fats = Math.round(weight * 1);
        } else {
            calories = tdee;
            protein = Math.round(weight * 2);
            fats = Math.round(weight * 1);
            deficitInfo = { name: 'Mantenimiento', desc: 'Calorías al nivel de gasto. Recomposición corporal.', rate: 'Peso estable', duration: 'Indefinido' };
        }

        carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
        if (carbs < 50) carbs = 50; // minimum carbs

        return { calories, protein, carbs, fats, tdee, deficitInfo };
    },

    setDeficitLevel(level) {
        this.deficitLevel = level;
        localStorage.setItem('fitai_deficit_level', level);
        App.renderCurrentPage();
    },

    generateMealPlan(macros, profile) {
        return [
            { icon: '🌅', name: 'Desayuno (7:00)', calories: Math.round(macros.calories * 0.25), protein: Math.round(macros.protein * 0.25), carbs: Math.round(macros.carbs * 0.3), fats: Math.round(macros.fats * 0.2), foods: 'Avena con leche + plátano + 4 claras + 1 huevo entero + tostada integral' },
            { icon: '🍎', name: 'Media Mañana (10:00)', calories: Math.round(macros.calories * 0.15), protein: Math.round(macros.protein * 0.15), carbs: Math.round(macros.carbs * 0.15), fats: Math.round(macros.fats * 0.25), foods: 'Yogur griego + 30g frutos secos + fruta de temporada' },
            { icon: '🍲', name: 'Almuerzo (13:30)', calories: Math.round(macros.calories * 0.30), protein: Math.round(macros.protein * 0.30), carbs: Math.round(macros.carbs * 0.30), fats: Math.round(macros.fats * 0.25), foods: '200g pechuga pollo/pescado + 100g arroz (crudo) + ensalada grande + aceite oliva' },
            { icon: '', name: 'Pre-entreno (16:30)', calories: Math.round(macros.calories * 0.15), protein: Math.round(macros.protein * 0.15), carbs: Math.round(macros.carbs * 0.2), fats: Math.round(macros.fats * 0.1), foods: 'Batido whey + plátano + 40g avena + miel' },
            { icon: '🌙', name: 'Cena (20:30)', calories: Math.round(macros.calories * 0.15), protein: Math.round(macros.protein * 0.15), carbs: Math.round(macros.carbs * 0.05), fats: Math.round(macros.fats * 0.2), foods: '150g salmón/atún + verduras salteadas + aguacate pequeño' }
        ];
    },

    getTodayLog() {
        const log = Storage.getNutritionLog();
        const today = new Date().toDateString();
        return log.filter(entry => new Date(entry.date).toDateString() === today);
    },

    getWaterCount() {
        const key = 'water_' + new Date().toISOString().split('T')[0];
        return parseInt(localStorage.getItem(key)) || 0;
    },

    getCaloriesBurned() {
        const workouts = Storage.getWorkoutHistory();
        const today = new Date().toDateString();
        const todayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === today);
        // Estimate: ~5 kcal per minute of training
        return todayWorkouts.reduce((sum, w) => sum + ((w.duration || 0) * 5), 0);
    },

    addWater() {
        const key = 'water_' + new Date().toISOString().split('T')[0];
        const current = this.getWaterCount();
        localStorage.setItem(key, Math.min(current + 1, 8));
        Helpers.showToast('💧 +1 vaso');
        App.renderCurrentPage();
    },

    logFood() {
        const entry = {
            name: document.getElementById('food-name')?.value || 'Comida',
            calories: parseInt(document.getElementById('food-cals')?.value) || 0,
            protein: parseInt(document.getElementById('food-protein')?.value) || 0,
            carbs: parseInt(document.getElementById('food-carbs')?.value) || 0,
            fats: parseInt(document.getElementById('food-fats')?.value) || 0
        };

        if (entry.calories === 0) {
            Helpers.showToast('Ingresa al menos las calorías', 'error');
            return;
        }

        Storage.addNutritionEntry(entry);
        Helpers.showToast('Comida registrada ✓');
        App.renderCurrentPage();
    },

    setTab(tab) {
        this.activeTab = tab;
        App.renderCurrentPage();
    }
};
