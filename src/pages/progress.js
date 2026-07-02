// ===== PROGRESS PAGE =====
const ProgressPage = {
    activeTab: 'overview',

    render() {
        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">📈 Tu Progreso</h2>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab ${this.activeTab === 'overview' ? 'active' : ''}" onclick="ProgressPage.setTab('overview')">General</button>
                <button class="tab ${this.activeTab === 'body' ? 'active' : ''}" onclick="ProgressPage.setTab('body')">Cuerpo</button>
                <button class="tab ${this.activeTab === 'strength' ? 'active' : ''}" onclick="ProgressPage.setTab('strength')">Fuerza</button>
                <button class="tab ${this.activeTab === 'photos' ? 'active' : ''}" onclick="ProgressPage.setTab('photos')">Fotos</button>
            </div>

            ${this.activeTab === 'overview' ? this.renderOverview() : ''}
            ${this.activeTab === 'body' ? this.renderBody() : ''}
            ${this.activeTab === 'strength' ? this.renderStrength() : ''}
            ${this.activeTab === 'photos' ? this.renderPhotos() : ''}
        </div>`;
    },

    renderOverview() {
        const workouts = Storage.getWorkoutHistory();
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);

        // Weekly volume chart data
        const weeklyData = this.getWeeklyData(workouts);

        return `
            <!-- Stats Overview -->
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon">🏋️</div>
                    <div class="stat-value">${workouts.length}</div>
                    <div class="stat-label">Entrenamientos</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-value">${totalDuration > 60 ? Math.round(totalDuration/60) + 'h' : totalDuration + 'm'}</div>
                    <div class="stat-label">Tiempo total</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💪</div>
                    <div class="stat-value">${totalVolume > 1000 ? (totalVolume/1000).toFixed(0) + 'k' : totalVolume}</div>
                    <div class="stat-label">Volumen (kg)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value">${Object.keys(Storage.getPRs()).length}</div>
                    <div class="stat-label">PRs</div>
                </div>
            </div>

            <!-- Weekly Volume Chart -->
            <div class="chart-container">
                <div class="chart-header">
                    <span class="chart-title">📊 Volumen Semanal</span>
                </div>
                <div class="chart-bars">
                    ${weeklyData.map((d, i) => `
                        <div class="chart-bar" style="height: ${d.percent}%" title="${d.label}: ${d.volume}kg"></div>
                    `).join('')}
                </div>
                <div class="chart-labels">
                    ${weeklyData.map(d => `<span>${d.label}</span>`).join('')}
                </div>
            </div>

            <!-- Recent Workouts -->
            <div class="section-header">
                <span class="section-title">🕒 Últimos Entrenamientos</span>
            </div>
            ${workouts.length === 0 ? `
                <p class="text-muted text-center" style="padding: 2rem;">Aún no has registrado entrenamientos</p>
            ` : workouts.slice(-5).reverse().map(w => `
                <div class="card mb-1" style="padding: 1rem;">
                    <div class="flex justify-between items-center">
                        <div>
                            <p style="font-weight: 600; font-size: 0.9rem;">${w.dayName || 'Entrenamiento'}</p>
                            <p class="text-muted" style="font-size: 0.75rem;">${Helpers.formatDate(w.date)}</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="font-size: 0.85rem; font-weight: 600; color: var(--primary);">${w.totalVolume || 0}kg</p>
                            <p class="text-muted" style="font-size: 0.75rem;">${w.duration || 0} min</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    },

    renderBody() {
        const measurements = Storage.getMeasurements();
        const profile = Storage.getProfile();

        return `
            <!-- Add Measurement -->
            <div class="card mb-3">
                <h3 class="card-title mb-2">📐 Registrar Medidas</h3>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Peso (kg)</label>
                        <input type="number" class="form-input" id="measure-weight" placeholder="${profile.weight || 70}" step="0.1">
                    </div>
                    <div class="form-group">
                        <label class="form-label">% Grasa</label>
                        <input type="number" class="form-input" id="measure-bf" placeholder="15" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pecho (cm)</label>
                        <input type="number" class="form-input" id="measure-chest" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Cintura (cm)</label>
                        <input type="number" class="form-input" id="measure-waist" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Brazo (cm)</label>
                        <input type="number" class="form-input" id="measure-arm" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Pierna (cm)</label>
                        <input type="number" class="form-input" id="measure-leg" step="0.5">
                    </div>
                </div>
                <button class="btn btn-primary btn-full mt-1" onclick="ProgressPage.saveMeasurement()">
                    💾 Guardar Medidas
                </button>
            </div>

            <!-- Measurement History -->
            <div class="section-header">
                <span class="section-title">📏 Historial de Medidas</span>
            </div>
            ${measurements.length === 0 ? `
                <p class="text-muted text-center" style="padding: 2rem;">No hay mediciones registradas aún</p>
            ` : measurements.slice(-10).reverse().map(m => `
                <div class="card mb-1" style="padding: 0.75rem 1rem;">
                    <div class="flex justify-between items-center">
                        <span class="text-muted" style="font-size: 0.75rem;">${Helpers.formatDate(m.date)}</span>
                        <div style="display: flex; gap: 0.75rem; font-size: 0.8rem;">
                            ${m.weight ? `<span>⚖️ ${m.weight}kg</span>` : ''}
                            ${m.bodyFat ? `<span>📊 ${m.bodyFat}%</span>` : ''}
                            ${m.chest ? `<span>💪 ${m.chest}cm</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    },

    renderStrength() {
        const prs = Storage.getPRs();
        const prEntries = Object.entries(prs).map(([id, data]) => {
            const exercise = EXERCISES_DB.find(e => e.id === id);
            return { ...data, id, name: exercise ? exercise.name : id, icon: exercise ? exercise.icon : '🏋️' };
        }).sort((a, b) => b.weight - a.weight);

        return `
            <div class="section-header mb-2">
                <span class="section-title">🏆 Records Personales</span>
                <span class="badge badge-warning">${prEntries.length} PRs</span>
            </div>

            ${prEntries.length === 0 ? `
                <div class="card text-center" style="padding: 3rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏆</div>
                    <p class="text-secondary">Aún no tienes PRs registrados</p>
                    <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.5rem;">Se registran automáticamente al entrenar</p>
                </div>
            ` : prEntries.map((pr, i) => `
                <div class="card mb-1" style="padding: 1rem;">
                    <div class="flex items-center gap-2">
                        <span style="font-size: 1.3rem; width: 30px; text-align: center;">${i < 3 ? ['🥇','🥈','🥉'][i] : pr.icon}</span>
                        <div style="flex: 1;">
                            <p style="font-weight: 600; font-size: 0.9rem;">${pr.name}</p>
                            <p class="text-muted" style="font-size: 0.75rem;">${Helpers.formatDate(pr.date)}</p>
                        </div>
                        <span style="font-size: 1.2rem; font-weight: 700; color: var(--warning);">${pr.weight}kg</span>
                    </div>
                </div>
            `).join('')}
        `;
    },

    renderPhotos() {
        const photos = Storage.getPhotos();

        return `
            <!-- Upload Photo -->
            <div class="photo-upload mb-3" onclick="document.getElementById('progress-photo-input').click()">
                <div class="photo-upload-icon">📸</div>
                <div class="photo-upload-text">Toca para subir foto de progreso</div>
                <p class="text-muted" style="font-size: 0.7rem; margin-top: 0.3rem;">Tip: Misma pose, iluminación y hora para comparar</p>
            </div>
            <input type="file" id="progress-photo-input" accept="image/*" style="display:none" onchange="ProgressPage.savePhoto(event)">

            <!-- Photo Grid -->
            ${photos.length === 0 ? `
                <p class="text-muted text-center" style="padding: 2rem;">No hay fotos de progreso. ¡Sube tu primera foto!</p>
            ` : `
                <div class="photo-grid">
                    ${photos.map(p => `
                        <div class="photo-item">
                            <img src="data:image/jpeg;base64,${p.data}" alt="Progreso ${Helpers.formatDate(p.date)}">
                        </div>
                    `).join('')}
                </div>
                <p class="text-muted text-center mt-2" style="font-size: 0.75rem;">${photos.length} fotos de progreso</p>
            `}
        `;
    },

    // Actions
    setTab(tab) {
        this.activeTab = tab;
        App.renderCurrentPage();
    },

    saveMeasurement() {
        const measurement = {
            weight: parseFloat(document.getElementById('measure-weight')?.value) || null,
            bodyFat: parseFloat(document.getElementById('measure-bf')?.value) || null,
            chest: parseFloat(document.getElementById('measure-chest')?.value) || null,
            waist: parseFloat(document.getElementById('measure-waist')?.value) || null,
            arm: parseFloat(document.getElementById('measure-arm')?.value) || null,
            leg: parseFloat(document.getElementById('measure-leg')?.value) || null
        };

        if (!measurement.weight && !measurement.bodyFat && !measurement.chest) {
            Helpers.showToast('Ingresa al menos una medida', 'error');
            return;
        }

        // Update profile weight if provided
        if (measurement.weight) {
            const profile = Storage.getProfile();
            profile.weight = measurement.weight;
            Storage.setProfile(profile);
        }

        Storage.addMeasurement(measurement);
        Helpers.showToast('Medidas guardadas ✓');
        App.renderCurrentPage();
    },

    savePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        Helpers.imageToBase64(file).then(base64 => {
            Storage.addPhoto({ data: base64, type: 'progress' });
            Helpers.showToast('Foto guardada 📸');
            App.renderCurrentPage();
        });
    },

    getWeeklyData(workouts) {
        const weeks = [];
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const weekWorkouts = workouts.filter(w => {
                const d = new Date(w.date);
                return d >= weekStart && d < weekEnd;
            });

            const volume = weekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
            weeks.push({ label: `S${8-i}`, volume, count: weekWorkouts.length });
        }

        const maxVolume = Math.max(...weeks.map(w => w.volume), 1);
        return weeks.map(w => ({ ...w, percent: Math.round((w.volume / maxVolume) * 100) }));
    }
};
