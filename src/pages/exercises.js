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
        const searchQuery = encodeURIComponent(ex.name + ' exercise form');

        return `
        <div class="animate-fade">
            <button class="btn btn-secondary btn-sm mb-3" onclick="ExercisesPage.closeDetail()">← Volver</button>

            <!-- Exercise Demo - Multiple sources with smart fallback -->
            <div class="exercise-video-container">
                <div id="exercise-demo" style="text-align: center; min-height: 180px;">
                    <img src="${ex.gifUrl}" 
                        alt="${ex.name}" 
                        style="width: 100%; max-width: 350px; border-radius: 12px; display: block; margin: 0 auto;"
                        onerror="this.style.display='none'; document.getElementById('exercise-fallback').style.display='flex';"
                    />
                    <div id="exercise-fallback" style="display: none; flex-direction: column; align-items: center; padding: 1.5rem; gap: 0.75rem;">
                        <span style="font-size: 3.5rem;">${ex.icon}</span>
                        <p style="font-size: 1.1rem; font-weight: 700;">${ex.name}</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; max-width: 280px;">${ex.description}</p>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <a href="https://www.youtube.com/results?search_query=${searchQuery}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                                ▶️ Ver Video
                            </a>
                            <a href="https://www.google.com/search?tbm=isch&q=${searchQuery}+gif" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                                🖼️ Ver Imágenes
                            </a>
                        </div>
                    </div>
                </div>
            </div>

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
                <div class="card mb-2" style="border-color: var(--primary);">
                    <h3 class="card-title mb-1">Tu Progresion</h3>
                    <div class="grid-2 gap-1">
                        <div class="stat-card">
                            <div class="stat-value" style="color:var(--primary)">${pr.weight}kg</div>
                            <div class="stat-label">PR actual</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value" style="color:var(--success)">${pr.weight + 2.5}kg</div>
                            <div class="stat-label">Proximo objetivo</div>
                        </div>
                    </div>
                    <div style="margin-top:0.6rem;font-size:0.72rem;color:var(--text-muted)">
                        <p>Peso de trabajo sugerido: <strong>${Math.round(pr.weight * 0.8)}kg</strong> (80% de PR)</p>
                        <p>Ultimo PR: ${Helpers.formatDate(pr.date)}</p>
                        <p>Sobrecarga: +2.5kg cuando completes todas las reps con buena tecnica</p>
                    </div>
                </div>
            ` : `
                <div class="card mb-2" style="border-color: var(--border);">
                    <h3 class="card-title mb-1">Peso Recomendado</h3>
                    <p style="font-size:0.78rem;color:var(--text-secondary)">
                        Sin PR registrado. Peso sugerido para empezar: <strong>~${Math.round((Storage.getProfile().weight||70) * (ex.category==='compound'?0.5:0.2))}kg</strong>
                    </p>
                    <p style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem">
                        Progresion: empieza ligero, sube 2.5kg/semana en compuestos, 1-2kg en aislamientos
                    </p>
                </div>
            `}

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

            <button class="btn btn-primary btn-full mt-2" onclick="ExercisesPage.askAI()">Preguntar a la IA sobre este ejercicio</button>
        </div>`;
    },

    askAI() {
        const ex = this.selectedExercise;
        if (!ex) return;
        const msg = `Explicame en detalle el ejercicio "${ex.name}": tecnica paso a paso, musculos involucrados, errores comunes, variantes, y como incluirlo en mi rutina. Mi nivel es ${Storage.getProfile().level||'intermedio'} y peso ${Storage.getProfile().weight||70}kg.`;
        Storage.addChatMessage({ role: 'user', content: msg });
        this.selectedExercise = null;
        App.navigate('ai-coach');
        setTimeout(() => AICoachPage.sendMessage(), 100);
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
