// ===== ROUTINE BUILDER - Constructor de Rutinas Personalizado =====
const RoutineBuilder = {
    isOpen: false,
    routineName: '',
    routineDays: [], // Array of { name: '', exercises: [] }
    currentDayIndex: 0,
    suggestedExercises: [],
    draggedExercise: null,

    open() {
        this.isOpen = true;
        this.routineName = '';
        this.routineDays = [{ name: 'Día 1', exercises: [] }];
        this.currentDayIndex = 0;
        BodyMap.selectedMuscles = [];
        App.renderCurrentPage();
    },

    close() {
        this.isOpen = false;
        BodyMap.selectedMuscles = [];
        App.renderCurrentPage();
    },

    render() {
        const currentDay = this.routineDays[this.currentDayIndex];

        return `
        <div class="animate-fade">
            <div class="flex justify-between items-center mb-3">
                <h2 style="font-size: 1.2rem; font-weight: 700;">🏗️ Constructor de Rutina</h2>
                <button class="btn btn-secondary btn-sm" onclick="RoutineBuilder.close()">✕ Cerrar</button>
            </div>

            <!-- Routine Name -->
            <div class="form-group">
                <label class="form-label">Nombre de la rutina</label>
                <input type="text" class="form-input" id="routine-name" placeholder="Ej: Mi PPL personalizado" value="${this.routineName}" onchange="RoutineBuilder.routineName = this.value">
            </div>

            <!-- Days Tabs -->
            <div class="flex gap-1 mb-2" style="overflow-x: auto; padding-bottom: 0.5rem;">
                ${this.routineDays.map((day, i) => `
                    <button class="tag ${i === this.currentDayIndex ? 'active' : ''}" onclick="RoutineBuilder.selectDay(${i})">
                        ${day.name}
                    </button>
                `).join('')}
                <button class="tag" onclick="RoutineBuilder.addDay()" style="border-style: dashed;">+ Día</button>
            </div>

            <!-- Day Name Edit -->
            <div class="form-group">
                <input type="text" class="form-input" placeholder="Nombre del día (ej: Push, Piernas, etc)" 
                    value="${currentDay.name}" 
                    onchange="RoutineBuilder.renameDayInput(this.value)">
            </div>

            <!-- TWO COLUMN LAYOUT -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <!-- Left: Body Map -->
                <div>
                    <p class="text-muted mb-1" style="font-size: 0.75rem;">👆 Toca los músculos que quieres entrenar:</p>
                    <div id="body-map-wrapper">
                        ${BodyMap.render({ selectable: true })}
                    </div>
                </div>

                <!-- Right: Suggested Exercises -->
                <div>
                    <p class="text-muted mb-1" style="font-size: 0.75rem;">📋 Ejercicios sugeridos (toca para añadir):</p>
                    <div id="suggested-exercises" style="max-height: 400px; overflow-y: auto;">
                        ${this.renderSuggestions()}
                    </div>
                </div>
            </div>

            <!-- Current Day Exercises (order) -->
            <div class="card mb-2">
                <div class="card-header">
                    <span class="card-title">📝 ${currentDay.name} - Ejercicios (${currentDay.exercises.length})</span>
                    <button class="btn btn-secondary btn-sm" onclick="RoutineBuilder.autoOrder()">🤖 Ordenar con IA</button>
                </div>
                <p class="text-muted" style="font-size: 0.7rem; margin-bottom: 0.75rem;">
                    Arrastra para reordenar. La IA sugiere: compuestos primero, aislamientos después.
                </p>
                ${currentDay.exercises.length === 0 ? `
                    <p class="text-muted text-center" style="padding: 1.5rem; font-size: 0.85rem;">
                        Selecciona músculos en el muñeco y añade ejercicios ☝️
                    </p>
                ` : `
                    <div id="exercise-order-list">
                        ${currentDay.exercises.map((ex, i) => `
                            <div class="exercise-order-item" data-index="${i}" draggable="true" 
                                ondragstart="RoutineBuilder.dragStart(event, ${i})"
                                ondragover="RoutineBuilder.dragOver(event)"
                                ondrop="RoutineBuilder.drop(event, ${i})">
                                <span class="order-num">${i + 1}</span>
                                <span class="order-icon">${ex.icon || '🏋️'}</span>
                                <div class="order-info">
                                    <span class="order-name">${ex.name}</span>
                                    <span class="order-detail">${ex.muscle} • ${ex.sets}x${ex.reps}</span>
                                </div>
                                <div class="order-actions">
                                    <button class="order-btn" onclick="RoutineBuilder.moveExercise(${i}, -1)">↑</button>
                                    <button class="order-btn" onclick="RoutineBuilder.moveExercise(${i}, 1)">↓</button>
                                    <button class="order-btn order-btn-remove" onclick="RoutineBuilder.removeExercise(${i})">✕</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>

            <!-- AI Suggestions -->
            <div class="card mb-2" style="border-color: var(--accent);">
                <p style="font-size: 0.8rem; color: var(--accent);">
                    💡 <strong>Tip IA:</strong> ${this.getAITip(currentDay)}
                </p>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
                ${this.routineDays.length > 1 ? `
                    <button class="btn btn-danger btn-sm" onclick="RoutineBuilder.removeDay()">🗑️ Eliminar día</button>
                ` : ''}
                <button class="btn btn-primary" style="flex: 1;" onclick="RoutineBuilder.saveRoutine()">
                    💾 Guardar Rutina
                </button>
            </div>
        </div>`;
    },

    renderSuggestions() {
        const exercises = BodyMap.getExercisesForSelected();
        if (exercises.length === 0 && BodyMap.selectedMuscles.length === 0) {
            return '<p class="text-muted text-center" style="padding: 1rem; font-size: 0.8rem;">Selecciona músculos para ver ejercicios recomendados</p>';
        }
        if (exercises.length === 0) {
            return '<p class="text-muted text-center" style="padding: 1rem; font-size: 0.8rem;">No hay ejercicios para los músculos seleccionados</p>';
        }

        // Sort: compounds first, then by EMG rating
        const sorted = exercises.sort((a, b) => {
            if (a.category === 'compound' && b.category !== 'compound') return -1;
            if (a.category !== 'compound' && b.category === 'compound') return 1;
            return 0;
        });

        return sorted.map(ex => {
            const isAdded = this.routineDays[this.currentDayIndex].exercises.some(e => e.id === ex.id);
            return `
                <div class="suggestion-item ${isAdded ? 'added' : ''}" onclick="${isAdded ? '' : `RoutineBuilder.addExercise('${ex.id}')`}">
                    <span style="font-size: 1.1rem;">${ex.icon || '🏋️'}</span>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${ex.name}</div>
                        <div style="font-size: 0.65rem; color: var(--text-muted);">${ex.muscle} • ${ex.category === 'compound' ? '⭐ Compound' : 'Aislamiento'} • ${ex.sets}x${ex.reps}</div>
                    </div>
                    <span style="font-size: 0.8rem;">${isAdded ? '✓' : '+'}</span>
                </div>
            `;
        }).join('');
    },

    updateSuggestions() {
        const container = document.getElementById('suggested-exercises');
        if (container) {
            container.innerHTML = this.renderSuggestions();
        }
    },

    // Day management
    addDay() {
        const num = this.routineDays.length + 1;
        this.routineDays.push({ name: `Día ${num}`, exercises: [] });
        this.currentDayIndex = this.routineDays.length - 1;
        BodyMap.selectedMuscles = [];
        App.renderCurrentPage();
    },

    removeDay() {
        if (this.routineDays.length <= 1) return;
        this.routineDays.splice(this.currentDayIndex, 1);
        this.currentDayIndex = Math.min(this.currentDayIndex, this.routineDays.length - 1);
        App.renderCurrentPage();
    },

    selectDay(index) {
        this.currentDayIndex = index;
        BodyMap.selectedMuscles = [];
        App.renderCurrentPage();
    },

    renameDayInput(name) {
        this.routineDays[this.currentDayIndex].name = name;
    },

    // Exercise management
    addExercise(id) {
        const exercise = EXERCISES_DB.find(e => e.id === id);
        if (!exercise) return;
        const day = this.routineDays[this.currentDayIndex];
        if (day.exercises.some(e => e.id === id)) return; // Already added
        day.exercises.push({ ...exercise });
        App.renderCurrentPage();
    },

    removeExercise(index) {
        this.routineDays[this.currentDayIndex].exercises.splice(index, 1);
        App.renderCurrentPage();
    },

    moveExercise(index, direction) {
        const exercises = this.routineDays[this.currentDayIndex].exercises;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= exercises.length) return;
        [exercises[index], exercises[newIndex]] = [exercises[newIndex], exercises[index]];
        App.renderCurrentPage();
    },

    // Drag and drop
    dragStart(event, index) {
        this.draggedExercise = index;
        event.dataTransfer.effectAllowed = 'move';
    },

    dragOver(event) {
        event.preventDefault();
    },

    drop(event, dropIndex) {
        event.preventDefault();
        if (this.draggedExercise === null || this.draggedExercise === dropIndex) return;
        const exercises = this.routineDays[this.currentDayIndex].exercises;
        const [dragged] = exercises.splice(this.draggedExercise, 1);
        exercises.splice(dropIndex, 0, dragged);
        this.draggedExercise = null;
        App.renderCurrentPage();
    },

    // AI Auto-order: compounds first, then isolation, grouped by muscle
    autoOrder() {
        const exercises = this.routineDays[this.currentDayIndex].exercises;
        if (exercises.length === 0) return;

        exercises.sort((a, b) => {
            // Compounds first
            if (a.category === 'compound' && b.category !== 'compound') return -1;
            if (a.category !== 'compound' && b.category === 'compound') return 1;
            // Then by rest time (heavier = more rest = first)
            return (b.rest || 60) - (a.rest || 60);
        });

        Helpers.showToast('🤖 Orden optimizado: compuestos pesados primero');
        App.renderCurrentPage();
    },

    getAITip(day) {
        const exercises = day.exercises;
        if (exercises.length === 0) return 'Selecciona músculos en el muñeco y añade ejercicios para este día.';
        
        const compounds = exercises.filter(e => e.category === 'compound');
        const isolations = exercises.filter(e => e.category === 'isolation');
        
        if (compounds.length === 0) return '⚠️ Añade al menos 1-2 ejercicios compuestos al inicio. Son la BASE de hipertrofia.';
        if (isolations.length === 0 && exercises.length < 4) return 'Añade 2-3 ejercicios de aislamiento para rematar los músculos.';
        if (exercises.length > 8) return '⚠️ Tienes muchos ejercicios. 5-7 es óptimo. Más no = mejor, solo más fatiga.';
        if (exercises.length >= 4 && exercises.length <= 7) return '✅ Buen volumen. Asegúrate de que los compuestos van primero (usa el botón "Ordenar con IA").';
        return `${compounds.length} compuestos + ${isolations.length} aislamientos. ${exercises.length < 5 ? 'Puedes añadir 1-2 más.' : 'Buen balance.'}`;
    },

    // Save routine
    saveRoutine() {
        const name = document.getElementById('routine-name')?.value || this.routineName || 'Mi Rutina';
        
        if (this.routineDays.every(d => d.exercises.length === 0)) {
            Helpers.showToast('Añade al menos 1 ejercicio', 'error');
            return;
        }

        const routine = {
            id: Helpers.generateId(),
            name: name,
            description: `Rutina personalizada - ${this.routineDays.length} días`,
            days: this.routineDays.map(day => ({
                name: day.name,
                exercises: day.exercises.map(ex => ex.id)
            })),
            custom: true,
            createdAt: new Date().toISOString()
        };

        Storage.saveRoutine(routine);
        this.isOpen = false;
        BodyMap.selectedMuscles = [];
        Helpers.showToast('✅ Rutina guardada!');
        App.renderCurrentPage();
    }
};
