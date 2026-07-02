// ===== EXERCISES PAGE =====
const ExercisesPage = {
    filter: 'all',
    searchQuery: '',
    selectedExercise: null,
    showBodyMap: true, // Show body map by default
    filteredByMuscles: [],

    filterByMuscles(muscles) {
        this.filteredByMuscles = muscles;
        this.showBodyMap = false;
        this.filter = 'bodymap';
        App.renderCurrentPage();
    },

    render() {
        if (this.selectedExercise) {
            return this.renderDetail();
        }

        const muscles = ['all', 'Pecho', 'Espalda', 'Hombros', 'Piernas', 'Bíceps', 'Tríceps', 'Core'];
        let filtered = EXERCISES_DB;

        if (this.filter === 'bodymap' && this.filteredByMuscles.length > 0) {
            filtered = filtered.filter(e => 
                this.filteredByMuscles.includes(e.muscle) || 
                (e.secondary && e.secondary.some(s => this.filteredByMuscles.includes(s)))
            );
        } else if (this.filter !== 'all') {
            filtered = filtered.filter(e => e.muscle === this.filter || (e.secondary && e.secondary.includes(this.filter)));
        }
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(q) || 
                e.muscle.toLowerCase().includes(q) ||
                e.equipment.toLowerCase().includes(q) ||
                (e.secondary && e.secondary.some(s => s.toLowerCase().includes(q)))
            );
        }

        // If showing body map (main view)
        if (this.showBodyMap && !this.searchQuery) {
            return `
            <div class="animate-fade">
                <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">📚 Ejercicios (${EXERCISES_DB.length})</h2>
                
                <!-- Search always visible -->
                <div class="form-group">
                    <input type="text" class="form-input" placeholder="🔍 Buscar ejercicio..." 
                        value="${this.searchQuery}" 
                        oninput="ExercisesPage.search(this.value)">
                </div>

                <!-- Body Map as main selector -->
                <div id="body-map-wrapper">
                    ${BodyMap.render({ selectable: true })}
                </div>

                <!-- Quick filters below -->
                <div style="margin-top: 1rem;">
                    <p class="text-muted mb-1" style="font-size: 0.75rem;">O selecciona por grupo:</p>
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                        ${muscles.filter(m => m !== 'all').map(m => `
                            <button class="tag" onclick="ExercisesPage.setFilter('${m}')" style="border-color: ${BodyMap.colors[m] || 'var(--border)'}; color: ${BodyMap.colors[m] || 'var(--text-secondary)'};">
                                ${m}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        }

        return `
        <div class="animate-fade">
            <div class="flex justify-between items-center mb-2">
                <h2 style="font-size: 1.2rem; font-weight: 700;">
                    ${this.filter === 'bodymap' ? `💪 ${this.filteredByMuscles.join(' + ')}` : this.filter !== 'all' ? `💪 ${this.filter}` : '📚 Todos los Ejercicios'}
                </h2>
                <button class="btn btn-secondary btn-sm" onclick="ExercisesPage.showBodyMapView()">🧍 Muñeco</button>
            </div>

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
        const muscleColor = BodyMap.colors[ex.muscle] || '#6C63FF';
        const searchTerm = encodeURIComponent(ex.name.replace(/\//g, ' ') + ' exercise');

        return `
        <div class="animate-fade">
            <button class="btn btn-secondary btn-sm mb-3" onclick="ExercisesPage.closeDetail()">← Volver</button>

            <!-- Exercise GIF from Tenor API (Google) - ALWAYS WORKS -->
            <div class="exercise-video-container" id="exercise-media-box">
                <div id="exercise-gif-display" style="text-align: center; padding: 1rem; min-height: 200px; display: flex; align-items: center; justify-content: center;">
                    <div class="loading-exercise">
                        <div style="font-size: 2rem; animation: bounce 1s infinite;">🏋️</div>
                        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: 0.5rem;">Cargando demostración...</p>
                    </div>
                </div>
            </div>
            <script>
                (function() {
                    const container = document.getElementById('exercise-gif-display');
                    const apiKey = 'AIzaSyC6uz2SsFEBTXxfgIF1J-ZEyqeHjGCMrmo';
                    const query = '${searchTerm}';
                    
                    fetch('https://tenor.googleapis.com/v2/search?q=' + query + '&key=' + apiKey + '&limit=1&media_filter=gif')
                        .then(r => r.json())
                        .then(data => {
                            if (data.results && data.results.length > 0) {
                                const gif = data.results[0].media_formats.gif || data.results[0].media_formats.mediumgif || data.results[0].media_formats.tinygif;
                                if (gif) {
                                    container.innerHTML = '<img src="' + gif.url + '" alt="${ex.name}" style="width:100%; max-width:400px; border-radius:12px; display:block; margin:0 auto;" />';
                                    return;
                                }
                            }
                            throw new Error('No GIF found');
                        })
                        .catch(() => {
                            container.innerHTML = \`
                                <div style="padding: 1.5rem; text-align: center;">
                                    <img src="${ex.gifUrl || ''}" alt="${ex.name}" 
                                        style="width:100%; max-width:350px; border-radius:12px; display:block; margin:0 auto;"
                                        onerror="this.parentElement.innerHTML='<div style=padding:2rem;text-align:center><span style=font-size:3rem>${ex.icon}</span><p style=margin-top:1rem;font-weight:600>${ex.name}</p><a href=https://www.youtube.com/results?search_query=${searchTerm} target=_blank class=btn\\ btn-primary\\ btn-sm style=margin-top:1rem>▶️ Ver en YouTube</a></div>'"
                                    />
                                </div>
                            \`;
                        });
                })();
            </script>

            <div class="text-center mb-3">
                <h2 style="font-size: 1.4rem; font-weight: 700;">${ex.icon} ${ex.name}</h2>
                <div class="flex justify-between items-center mt-1" style="justify-content: center; gap: 0.75rem;">
                    <span class="badge" style="background: ${muscleColor}22; color: ${muscleColor};">${ex.muscle}</span>
                    <span class="badge badge-accent">${ex.equipment}</span>
                    <span class="badge badge-${ex.difficulty === 'principiante' ? 'success' : ex.difficulty === 'intermedio' ? 'warning' : 'danger'}">${ex.difficulty}</span>
                </div>
                ${ex.secondary && ex.secondary.length > 0 ? `
                    <p class="text-muted mt-1" style="font-size: 0.75rem;">También trabaja: ${ex.secondary.join(', ')}</p>
                ` : ''}
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
    },

    showBodyMapView() {
        this.showBodyMap = true;
        this.filter = 'all';
        this.filteredByMuscles = [];
        BodyMap.selectedMuscles = [];
        App.renderCurrentPage();
    },

    toggleBodyMap() {
        this.showBodyMap = !this.showBodyMap;
        if (!this.showBodyMap) {
            BodyMap.selectedMuscles = [];
        }
        App.renderCurrentPage();
    },

    onBodyMapSelect(muscles) {
        if (muscles.length > 0) {
            ExercisesPage.filter = 'bodymap';
        } else {
            ExercisesPage.filter = 'all';
        }
        App.renderCurrentPage();
    }
};
