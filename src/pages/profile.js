// ===== PROFILE PAGE =====
const ProfilePage = {
    activeTab: 'profile',
    editing: false,

    render() {
        const profile = Storage.getProfile();
        const settings = Storage.getSettings();

        return `
        <div class="animate-fade">
            <!-- Tabs -->
            <div class="tabs mb-3">
                <button class="tab ${this.activeTab === 'profile' ? 'active' : ''}" onclick="ProfilePage.setTab('profile')">Perfil</button>
                <button class="tab ${this.activeTab === 'assessment' ? 'active' : ''}" onclick="ProfilePage.setTab('assessment')">Valoración</button>
                <button class="tab ${this.activeTab === 'settings' ? 'active' : ''}" onclick="ProfilePage.setTab('settings')">Config</button>
            </div>

            ${this.activeTab === 'profile' ? this.renderProfile(profile) : ''}
            ${this.activeTab === 'assessment' ? this.renderAssessment(profile) : ''}
            ${this.activeTab === 'settings' ? this.renderSettings(settings) : ''}
        </div>`;
    },

    renderProfile(profile) {
        const week = Storage.getCurrentWeek();
        const workouts = Storage.getWorkoutHistory();
        const bmi = profile.weight && profile.height ? Helpers.calculateBMI(profile.weight, profile.height) : '—';

        return `
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="profile-avatar">${profile.name ? profile.name[0].toUpperCase() : '👤'}</div>
                <div class="profile-name">${profile.name || 'Tu Nombre'}</div>
                <p class="text-secondary" style="font-size: 0.85rem;">Semana ${week}/12 del programa</p>
                <div class="profile-stats">
                    <div class="profile-stat">
                        <div class="profile-stat-value">${workouts.length}</div>
                        <div class="profile-stat-label">Entrenos</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${week}</div>
                        <div class="profile-stat-label">Semanas</div>
                    </div>
                    <div class="profile-stat">
                        <div class="profile-stat-value">${Object.keys(Storage.getPRs()).length}</div>
                        <div class="profile-stat-label">PRs</div>
                    </div>
                </div>
            </div>

            <!-- Profile Form -->
            <div class="card mb-2">
                <h3 class="card-title mb-2"> Datos Personales</h3>
                <div class="form-group">
                    <label class="form-label">Nombre</label>
                    <input type="text" class="form-input" id="prof-name" value="${profile.name || ''}" placeholder="Tu nombre">
                </div>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Edad</label>
                        <input type="number" class="form-input" id="prof-age" value="${profile.age || ''}" placeholder="25">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Género</label>
                        <select class="form-select" id="prof-gender">
                            <option value="" ${!profile.gender ? 'selected' : ''}>Seleccionar</option>
                            <option value="hombre" ${profile.gender === 'hombre' ? 'selected' : ''}>Hombre</option>
                            <option value="mujer" ${profile.gender === 'mujer' ? 'selected' : ''}>Mujer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" class="form-input" id="prof-weight" value="${profile.weight || ''}" placeholder="70" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Altura (cm)</label>
                        <input type="number" class="form-input" id="prof-height" value="${profile.height || ''}" placeholder="175">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Objetivo</label>
                    <select class="form-select" id="prof-goal">
                        <option value="" ${!profile.goal ? 'selected' : ''}>Seleccionar objetivo</option>
                        <option value="ganar músculo" ${profile.goal === 'ganar músculo' ? 'selected' : ''}>Ganar músculo (volumen)</option>
                        <option value="perder grasa" ${profile.goal === 'perder grasa' ? 'selected' : ''}>Perder grasa (definición)</option>
                        <option value="recomposición" ${profile.goal === 'recomposición' ? 'selected' : ''}>Recomposición corporal</option>
                        <option value="fuerza" ${profile.goal === 'fuerza' ? 'selected' : ''}>Ganar fuerza</option>
                        <option value="salud general" ${profile.goal === 'salud general' ? 'selected' : ''}>Salud y fitness general</option>
                    </select>
                </div>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Nivel</label>
                        <select class="form-select" id="prof-level">
                            <option value="principiante" ${profile.level === 'principiante' ? 'selected' : ''}>Principiante (0-1 año)</option>
                            <option value="intermedio" ${profile.level === 'intermedio' ? 'selected' : ''}>Intermedio (1-3 años)</option>
                            <option value="avanzado" ${profile.level === 'avanzado' ? 'selected' : ''}>Avanzado (3+ años)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Días/semana</label>
                        <select class="form-select" id="prof-days">
                            ${[3,4,5,6].map(d => `<option value="${d}" ${profile.daysPerWeek === d ? 'selected' : ''}>${d} días</option>`).join('')}
                        </select>
                    </div>
                </div>

                <button class="btn btn-primary btn-full mt-2" onclick="ProfilePage.saveProfile()">
                    💾 Guardar Perfil
                </button>
            </div>

            <!-- Quick Stats -->
            <div class="card">
                <h3 class="card-title mb-1"> Resumen</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 2;">
                    <p>IMC: <strong>${bmi}</strong></p>
                    <p>TDEE estimado: <strong>${profile.weight && profile.height && profile.age ? Helpers.calculateTDEE(profile.weight, profile.height, profile.age, profile.gender, 'activo') : '—'} kcal</strong></p>
                    <p>Proteína diaria: <strong>${profile.weight ? Math.round(profile.weight * 2) : '—'}g</strong></p>
                </div>
            </div>
        `;
    },

    renderAssessment(profile) {
        const bmi = profile.weight && profile.height ? Helpers.calculateBMI(profile.weight, profile.height) : null;

        return `
            <div class="card mb-3">
                <h3 class="card-title mb-2"> Valoración Física</h3>
                ${bmi ? `
                    <div class="text-center mb-3">
                        <p style="font-size: 2.5rem; font-weight: 800; color: ${bmi < 25 ? 'var(--success)' : bmi < 30 ? 'var(--warning)' : 'var(--danger)'};">${bmi}</p>
                        <p class="text-muted">IMC (Índice de Masa Corporal)</p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                            ${bmi < 18.5 ? 'Bajo peso - Prioriza ganar masa' : bmi < 25 ? 'Peso normal - Excelente base' : bmi < 30 ? 'Sobrepeso - Ideal para recomposición' : 'Obesidad - Enfócate en déficit moderado'}
                        </p>
                    </div>
                ` : '<p class="text-muted text-center">Completa tu perfil para ver la valoración</p>'}
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-2"> Tu Plan de 12 Semanas</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                    ${PERIODIZATION.weeks.map(w => `
                        <div class="flex items-center gap-2" style="padding: 0.3rem 0; border-bottom: 1px solid var(--border); ${w.week === Storage.getCurrentWeek() ? 'background: rgba(108,99,255,0.1); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--primary);' : ''}">
                            <span style="min-width: 55px; font-weight: ${w.week === Storage.getCurrentWeek() ? '700' : '400'};">S${w.week}</span>
                            <span style="flex: 1;">${w.phase}</span>
                            <span class="badge badge-${w.deload ? 'success' : w.intensity > 80 ? 'danger' : 'primary'}" style="font-size: 0.65rem;">${w.intensity}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">📐 Resultados Esperados (12 semanas)</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
                    ${profile.level === 'principiante' ? `
                        <p> Ganancia muscular: <strong>3-6 kg</strong></p>
                        <p> Aumento de fuerza: <strong>30-50%</strong></p>
                        <p> Cambio visual: <strong>Muy notable</strong></p>
                    ` : profile.level === 'intermedio' ? `
                        <p> Ganancia muscular: <strong>1.5-3 kg</strong></p>
                        <p> Aumento de fuerza: <strong>10-20%</strong></p>
                        <p> Cambio visual: <strong>Notable</strong></p>
                    ` : `
                        <p> Ganancia muscular: <strong>0.5-1.5 kg</strong></p>
                        <p> Aumento de fuerza: <strong>5-10%</strong></p>
                        <p> Cambio visual: <strong>Sutil pero real</strong></p>
                    `}
                </div>
            </div>

            <button class="btn btn-primary btn-full" onclick="App.navigate('ai-coach'); setTimeout(() => AICoachPage.quickPrompt('Hazme una valoración física completa'), 300);">
                🤖 Valoración Completa con IA
            </button>
        `;
    },

    renderSettings(settings) {
        return `
            <div class="card mb-2">
                <h3 class="card-title mb-2">IA y API</h3>

                <div class="form-group">
                    <label class="form-label">API Key de Groq (IA avanzada)</label>
                    <input type="password" class="form-input" id="setting-apikey" value="${settings.apiKey || ''}" placeholder="gsk_...">
                    <p class="text-muted" style="font-size: 0.7rem; margin-top: 0.3rem;">Opcional. Obtén tu key gratis en <a href="https://console.groq.com" target="_blank" style="color:var(--primary)">console.groq.com</a>. Sin key, la IA funciona con respuestas locales inteligentes.</p>
                </div>

                <button class="btn btn-primary btn-full mt-1" onclick="ProfilePage.saveSettings()">
                    Guardar Configuracion
                </button>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-2">Preferencias</h3>

                <div class="form-group">
                    <label class="form-label">Unidades</label>
                    <select class="form-select" id="setting-units">
                        <option value="metric" ${settings.units === 'metric' ? 'selected' : ''}>Metrico (kg, cm)</option>
                        <option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>Imperial (lb, in)</option>
                    </select>
                </div>

                <div class="flex items-center justify-between" style="padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                    <span style="font-size: 0.85rem;">Timer de descanso automatico</span>
                    <label style="cursor: pointer;">
                        <input type="checkbox" id="setting-timer" ${settings.restTimer !== false ? 'checked' : ''} style="width: 20px; height: 20px;">
                    </label>
                </div>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">Datos y Backup</h3>
                <div class="flex flex-col gap-1 mt-2">
                    <button class="btn btn-secondary btn-full btn-sm" onclick="ProfilePage.exportData()">
                        Exportar Datos (JSON)
                    </button>
                    <button class="btn btn-secondary btn-full btn-sm" onclick="document.getElementById('import-data-input').click()">
                        Importar Datos
                    </button>
                    <button class="btn btn-secondary btn-full btn-sm" onclick="ProfilePage.resetProgram()">
                        Reiniciar Programa (Semana 1)
                    </button>
                    <button class="btn btn-danger btn-full btn-sm" onclick="ProfilePage.clearAllData()">
                        Borrar Todos los Datos
                    </button>
                </div>
                <input type="file" id="import-data-input" accept=".json" style="display:none" onchange="ProfilePage.importData(event)">
            </div>

            <div class="card" style="border-color: var(--primary);">
                <p style="font-size: 0.78rem; color: var(--text-secondary); text-align: center; line-height: 1.6;">
                    <strong style="color:var(--primary)">FitAI Pro v2.0</strong><br>
                    Coach de fitness con inteligencia artificial<br>
                    200+ ejercicios | Periodizacion cientifica | Nutricion personalizada<br>
                    <span style="color:var(--text-muted);font-size:0.68rem;">Datos almacenados localmente en tu dispositivo</span>
                </p>
            </div>
        `;
    },

    // Actions
    setTab(tab) {
        this.activeTab = tab;
        App.renderCurrentPage();
    },

    saveProfile() {
        const profile = {
            name: document.getElementById('prof-name')?.value || '',
            age: parseInt(document.getElementById('prof-age')?.value) || 0,
            gender: document.getElementById('prof-gender')?.value || '',
            weight: parseFloat(document.getElementById('prof-weight')?.value) || 0,
            height: parseFloat(document.getElementById('prof-height')?.value) || 0,
            goal: document.getElementById('prof-goal')?.value || '',
            level: document.getElementById('prof-level')?.value || 'intermedio',
            daysPerWeek: parseInt(document.getElementById('prof-days')?.value) || 4,
            startDate: Storage.getProfile().startDate || new Date().toISOString()
        };

        Storage.setProfile(profile);
        Helpers.showToast('Perfil guardado ✓');
        App.renderCurrentPage();
    },

    saveSettings() {
        const settings = {
            apiKey: document.getElementById('setting-apikey')?.value || '',
            units: document.getElementById('setting-units')?.value || 'metric',
            restTimer: document.getElementById('setting-timer')?.checked || false
        };

        Storage.setSettings(settings);
        Helpers.showToast('Configuración guardada ✓');
    },

    exportData() {
        const data = {
            profile: Storage.getProfile(),
            routines: Storage.getRoutines(),
            workoutHistory: Storage.getWorkoutHistory(),
            measurements: Storage.getMeasurements(),
            prs: Storage.getPRs(),
            nutritionLog: Storage.getNutritionLog(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitai-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Helpers.showToast('Datos exportados ✓');
    },

    resetProgram() {
        if (confirm('¿Reiniciar el programa? Tu perfil y datos se mantienen, solo se reinicia la semana.')) {
            const profile = Storage.getProfile();
            profile.startDate = new Date().toISOString();
            Storage.setProfile(profile);
            Helpers.showToast('Programa reiniciado - Semana 1');
            App.renderCurrentPage();
        }
    },

    clearAllData() {
        if (confirm('Borrar TODOS los datos? Esta accion no se puede deshacer.')) {
            if (confirm('Estas seguro? Se perdera todo tu progreso.')) {
                localStorage.clear();
                Helpers.showToast('Datos eliminados');
                location.reload();
            }
        }
    },

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.profile) Storage.setProfile(data.profile);
                if (data.routines) Storage.set('routines', data.routines);
                if (data.workoutHistory) Storage.set('workoutHistory', data.workoutHistory);
                if (data.measurements) Storage.set('measurements', data.measurements);
                if (data.prs) Storage.set('prs', data.prs);
                if (data.nutritionLog) Storage.set('nutritionLog', data.nutritionLog);
                Helpers.showToast('Datos importados correctamente!');
                App.renderCurrentPage();
            } catch(err) {
                Helpers.showToast('Error: archivo JSON invalido', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }
};
