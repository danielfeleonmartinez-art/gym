// ===== EXERCISES PAGE =====
const ExercisesPage = {
    filter: 'all',
    searchQuery: '',
    selectedExercise: null,

    render() {
        if (this.selectedExercise) {
            return this.renderDetail();
        }

        const muscles = ['all', 'Pecho', 'Espalda', 'Hombros', 'Piernas', 'Bíceps', 'Tríceps', 'Core'];
        let filtered = EXERCISES_DB;

        if (this.filter !== 'all') {
            filtered = filtered.filter(e => e.muscle === this.filter);
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(q) || 
                e.muscle.toLowerCase().includes(q) ||
                e.equipment.toLowerCase().includes(q)
            );
        }

        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">📚 Biblioteca de Ejercicios</h2>

            <!-- Search -->
            <div class="form-group">
                <input type="text" class="form-input" placeholder="🔍 Buscar ejercicio..." 
                    value="${this.searchQuery}" 
                    oninput="ExercisesPage.search(this.value)">
            </div>

            <!-- Muscle Filter -->
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.5rem; overflow-x: auto;">
                ${muscles.map(m => `
                    <button class="tag ${this.filter === m ? 'active' : ''}" onclick="ExercisesPage.setFilter('${m}')">
                        ${m === 'all' ? '🏋️ Todos' : m}
                    </button>
                `).join('')}
            </div>

            <!-- Results count -->
            <p class="text-muted mb-2" style="font-size: 0.8rem;">${filtered.length} ejercicios</p>

            <!-- Exercise List -->
            ${filtered.map(exercise => `
                <div class="exercise-item" onclick="ExercisesPage.selectExercise('${exercise.id}')">
                    <div class="exercise-icon">${exercise.icon}</div>
                    <div class="exercise-info">
                        <div class="exercise-name">${exercise.name}</div>
                        <div class="exercise-detail">${exercise.muscle} • ${exercise.equipment} • ${exercise.sets}x${exercise.reps}</div>
                    </div>
                    <span class="badge badge-${exercise.difficulty === 'principiante' ? 'success' : exercise.difficulty === 'intermedio' ? 'warning' : 'danger'}" style="font-size: 0.65rem;">
                        ${exercise.difficulty}
                    </span>
                </div>
            `).join('')}
        </div>`;
    },

    renderDetail() {
        const ex = this.selectedExercise;
        const pr = Storage.getPRs()[ex.id];

        return `
        <div class="animate-fade">
            <button class="btn btn-secondary btn-sm mb-3" onclick="ExercisesPage.closeDetail()">← Volver</button>

            <div class="text-center mb-3">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${ex.icon}</div>
                <h2 style="font-size: 1.4rem; font-weight: 700;">${ex.name}</h2>
                <div class="flex justify-between items-center mt-1" style="justify-content: center; gap: 0.75rem;">
                    <span class="badge badge-primary">${ex.muscle}</span>
                    <span class="badge badge-accent">${ex.equipment}</span>
                    <span class="badge badge-${ex.difficulty === 'principiante' ? 'success' : ex.difficulty === 'intermedio' ? 'warning' : 'danger'}">${ex.difficulty}</span>
                </div>
            </div>

            ${pr ? `
                <div class="card mb-2" style="border-color: var(--warning); text-align: center;">
                    <span style="font-size: 1.2rem;">🏆</span>
                    <span style="font-weight: 700; color: var(--warning);"> PR: ${pr.weight}kg</span>
                    <span class="text-muted" style="font-size: 0.75rem;"> (${Helpers.formatDate(pr.date)})</span>
                </div>
            ` : ''}

            <div class="card mb-2">
                <h3 class="card-title mb-1">📋 Descripción</h3>
                <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6;">${ex.description}</p>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">📊 Parámetros Recomendados</h3>
                <div class="grid-3 gap-1">
                    <div class="stat-card">
                        <div class="stat-value" style="font-size: 1.2rem;">${ex.sets}</div>
                        <div class="stat-label">Series</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="font-size: 1.2rem;">${ex.reps}</div>
                        <div class="stat-label">Reps</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value" style="font-size: 1.2rem;">${ex.rest}s</div>
                        <div class="stat-label">Descanso</div>
                    </div>
                </div>
            </div>

            <div class="card mb-2">
                <h3 class="card-title mb-1">💡 Tips de Técnica</h3>
                <ul style="list-style: none; padding: 0;">
                    ${ex.tips.map(tip => `
                        <li style="padding: 0.4rem 0; font-size: 0.85rem; color: var(--text-secondary); border-bottom: 1px solid var(--border);">
                            ✓ ${tip}
                        </li>
                    `).join('')}
                </ul>
            </div>

            <div class="card">
                <h3 class="card-title mb-1">📂 Información</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    <p><strong>Categoría:</strong> ${ex.category === 'compound' ? 'Compuesto (multi-articular)' : 'Aislamiento'}</p>
                    <p style="margin-top: 0.3rem;"><strong>Equipamiento:</strong> ${ex.equipment}</p>
                    <p style="margin-top: 0.3rem;"><strong>Músculo principal:</strong> ${ex.muscle}</p>
                </div>
            </div>
        </div>`;
    },

    setFilter(filter) {
        this.filter = filter;
        App.renderCurrentPage();
    },

    search(query) {
        this.searchQuery = query;
        App.renderCurrentPage();
    },

    selectExercise(id) {
        this.selectedExercise = EXERCISES_DB.find(e => e.id === id);
        App.renderCurrentPage();
    },

    closeDetail() {
        this.selectedExercise = null;
        App.renderCurrentPage();
    }
};
