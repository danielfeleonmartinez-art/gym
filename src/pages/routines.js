// ===== ROUTINES PAGE =====
const RoutinesPage = {
    currentView: 'list', // list, detail, execute
    selectedRoutine: null,
    executionState: null,

    render() {
        if (this.currentView === 'execute' && this.executionState) {
            return this.renderExecution();
        }
        if (this.currentView === 'detail' && this.selectedRoutine) {
            return this.renderDetail();
        }
        return this.renderList();
    },

    renderList() {
        const routines = Storage.getRoutines();
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        return `
        <div class="animate-fade">
            <div class="section-header mb-3">
                <h2 style="font-size: 1.3rem; font-weight: 700;">💪 Mis Rutinas</h2>
                <button class="btn btn-primary btn-sm" onclick="RoutinesPage.createRoutine()">+ Crear</button>
            </div>

            <!-- Current Phase Info -->
            <div class="card mb-3" style="border-color: var(--primary);">
                <div class="flex items-center gap-2">
                    <span style="font-size: 1.5rem;">📅</span>
                    <div>
                        <p style="font-weight: 600; font-size: 0.9rem;">Semana ${week} - ${periodWeek.phase}</p>
                        <p class="text-muted" style="font-size: 0.8rem;">Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe} ${periodWeek.deload ? '| 🟢 DELOAD' : ''}</p>
                    </div>
                </div>
            </div>

            ${routines.length === 0 ? `
                <div class="card text-center" style="padding: 3rem 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🏋️</div>
                    <h3 style="margin-bottom: 0.5rem;">No tienes rutinas aún</h3>
                    <p class="text-secondary mb-3" style="font-size: 0.9rem;">Genera una rutina con IA o crea la tuya propia</p>
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-primary btn-full" onclick="RoutinesPage.generateAIRoutine()">
                            🤖 Generar con IA
                        </button>
                        <button class="btn btn-secondary btn-full" onclick="RoutinesPage.showTemplates()">
                            📋 Usar Plantilla
                        </button>
                    </div>
                </div>
            ` : `
                <!-- Routine Cards -->
                ${routines.map(routine => `
                    <div class="workout-card" onclick="RoutinesPage.viewRoutine('${routine.id}')">
                        <div class="workout-header">
                            <div>
                                <div class="workout-title">${routine.name}</div>
                                <p class="text-muted" style="font-size: 0.75rem; margin-top: 0.2rem;">${routine.description || ''}</p>
                            </div>
                            <span class="badge badge-primary">${routine.days ? routine.days.length + ' días' : ''}</span>
                        </div>
                        <div class="workout-meta">
                            <span>📅 ${routine.days ? routine.days.length : '?'}x/semana</span>
                            <span>⏱️ ~60 min</span>
                            <span>📊 ${routine.phase || periodWeek.phase}</span>
                        </div>
                    </div>
                `).join('')}

                <div class="mt-3 flex flex-col gap-2">
                    <button class="btn btn-primary btn-full" onclick="RoutinesPage.generateAIRoutine()">
                        🤖 Generar Nueva Rutina con IA
                    </button>
                    <button class="btn btn-secondary btn-full" onclick="RoutinesPage.showTemplates()">
                        📋 Usar Plantilla
                    </button>
                </div>
            `}
        </div>`;
    },

    renderDetail() {
        const routine = this.selectedRoutine;
        if (!routine) return '';

        return `
        <div class="animate-fade">
            <button class="btn btn-secondary btn-sm mb-3" onclick="RoutinesPage.backToList()">
                ← Volver
            </button>

            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem;">${routine.name}</h2>
            <p class="text-secondary mb-3" style="font-size: 0.85rem;">${routine.description || ''}</p>

            ${routine.days.map((day, dayIndex) => `
                <div class="card mb-2">
                    <div class="card-header">
                        <span class="card-title">Día ${dayIndex + 1}: ${day.name}</span>
                        <button class="btn btn-success btn-sm" onclick="RoutinesPage.startExecution('${routine.id}', ${dayIndex})">
                            ▶ Iniciar
                        </button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${day.exercises.map(ex => {
                            const exercise = typeof ex === 'string' ? EXERCISES_DB.find(e => e.id === ex) : ex;
                            if (!exercise) return '';
                            return `
                                <div class="flex items-center gap-2" style="padding: 0.4rem 0; border-bottom: 1px solid var(--border);">
                                    <span style="font-size: 1.1rem;">${exercise.icon || '🏋️'}</span>
                                    <div style="flex: 1;">
                                        <span style="font-size: 0.85rem; font-weight: 500;">${exercise.name}</span>
                                        <span class="text-muted" style="font-size: 0.75rem; margin-left: 0.5rem;">${exercise.sets || 3}x${exercise.reps || '10-12'}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}

            <div class="mt-3 flex gap-2">
                <button class="btn btn-danger btn-sm" onclick="RoutinesPage.deleteRoutine('${routine.id}')">
                    🗑️ Eliminar
                </button>
            </div>
        </div>`;
    },


    renderExecution() {
        const state = this.executionState;
        if (!state) return '';
        const currentExercise = state.exercises[state.currentExerciseIndex];
        const exercise = typeof currentExercise === 'string' ? EXERCISES_DB.find(e => e.id === currentExercise) : currentExercise;

        return `
        <div class="animate-fade">
            <div class="flex justify-between items-center mb-3">
                <button class="btn btn-secondary btn-sm" onclick="RoutinesPage.exitExecution()">✕ Salir</button>
                <span class="badge badge-primary">${state.currentExerciseIndex + 1}/${state.exercises.length}</span>
            </div>

            <!-- Progress -->
            <div class="progress-bar mb-3" style="height: 6px;">
                <div class="progress-fill accent" style="width: ${Math.round((state.currentExerciseIndex / state.exercises.length) * 100)}%"></div>
            </div>

            <!-- Timer -->
            <div class="timer-display">
                <div class="timer-value" id="workout-timer">${Helpers.formatTime(state.elapsedTime)}</div>
                <div class="timer-label">Tiempo total</div>
            </div>

            <!-- Current Exercise -->
            <div class="exercise-execution">
                <div class="flex items-center gap-2 mb-2">
                    <span style="font-size: 1.5rem;">${exercise ? exercise.icon : '🏋️'}</span>
                    <div>
                        <h3 style="font-size: 1.1rem; font-weight: 700;">${exercise ? exercise.name : 'Ejercicio'}</h3>
                        <p class="text-muted" style="font-size: 0.8rem;">${exercise ? exercise.muscle : ''} • Descanso: ${exercise ? exercise.rest : 60}s</p>
                    </div>
                </div>

                ${exercise && exercise.tips ? `
                    <div style="background: rgba(108,99,255,0.1); border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem;">
                        <p style="font-size: 0.75rem; color: var(--primary);">💡 ${exercise.tips[0]}</p>
                    </div>
                ` : ''}

                <!-- Sets -->
                <div id="sets-container">
                    ${Array.from({length: exercise ? exercise.sets : 3}, (_, i) => `
                        <div class="set-row">
                            <div class="set-number ${state.completedSets[state.currentExerciseIndex] && state.completedSets[state.currentExerciseIndex][i] ? 'completed' : ''}">${i + 1}</div>
                            <div class="set-inputs">
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-muted);">Peso (kg)</label>
                                    <input type="number" class="set-input" id="weight-${i}" placeholder="kg" value="${state.weights[state.currentExerciseIndex] ? state.weights[state.currentExerciseIndex][i] || '' : ''}">
                                </div>
                                <div>
                                    <label style="font-size: 0.65rem; color: var(--text-muted);">Reps</label>
                                    <input type="number" class="set-input" id="reps-${i}" placeholder="reps" value="${state.reps[state.currentExerciseIndex] ? state.reps[state.currentExerciseIndex][i] || '' : ''}">
                                </div>
                            </div>
                            <button class="btn btn-success btn-sm" onclick="RoutinesPage.completeSet(${i})" ${state.completedSets[state.currentExerciseIndex] && state.completedSets[state.currentExerciseIndex][i] ? 'disabled style="opacity:0.5"' : ''}>
                                ✓
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Rest Timer -->
            <div id="rest-timer-container" class="hidden">
                <div class="card text-center" style="border-color: var(--accent);">
                    <p style="font-size: 0.8rem; color: var(--accent); margin-bottom: 0.5rem;">⏱️ Descanso</p>
                    <div id="rest-timer-value" style="font-size: 2rem; font-weight: 700; color: var(--accent);">00:00</div>
                    <button class="btn btn-accent btn-sm mt-2" onclick="RoutinesPage.skipRest()">Saltar →</button>
                </div>
            </div>

            <!-- Navigation -->
            <div class="flex gap-2 mt-3">
                <button class="btn btn-secondary" onclick="RoutinesPage.prevExercise()" ${state.currentExerciseIndex === 0 ? 'disabled style="opacity:0.5"' : ''}>
                    ← Anterior
                </button>
                <button class="btn btn-primary" style="flex:1;" onclick="RoutinesPage.nextExercise()">
                    ${state.currentExerciseIndex === state.exercises.length - 1 ? '🎉 Finalizar' : 'Siguiente →'}
                </button>
            </div>
        </div>`;
    },

    // Actions
    generateAIRoutine() {
        const routine = AIEngine.generateCustomRoutine(Storage.getProfile());
        Storage.saveRoutine(routine);
        Helpers.showToast('¡Rutina generada con IA! 🤖');
        App.renderCurrentPage();
    },

    showTemplates() {
        const modal = document.getElementById('onboarding-modal');
        modal.classList.remove('hidden');
        document.getElementById('onboarding-steps').innerHTML = `
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">📋 Plantillas de Rutina</h2>
            ${Object.entries(ROUTINE_TEMPLATES).map(([key, tmpl]) => `
                <div class="workout-card" onclick="RoutinesPage.useTemplate('${key}')">
                    <div class="workout-title">${tmpl.name}</div>
                    <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.3rem;">${tmpl.description}</p>
                    <div class="workout-meta mt-1">
                        <span>📆 ${tmpl.frequency} días</span>
                        <span>⏱️ ${tmpl.duration}</span>
                        <span>📊 ${tmpl.level}</span>
                    </div>
                </div>
            `).join('')}
            <button class="btn btn-secondary btn-full mt-2" onclick="document.getElementById('onboarding-modal').classList.add('hidden')">Cancelar</button>
        `;
    },

    useTemplate(key) {
        const template = ROUTINE_TEMPLATES[key];
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        const routine = {
            id: Helpers.generateId(),
            name: template.name,
            description: template.description,
            days: template.days.map(day => ({
                name: day.name,
                exercises: day.exercises
            })),
            phase: periodWeek.phase,
            createdAt: new Date().toISOString()
        };

        Storage.saveRoutine(routine);
        document.getElementById('onboarding-modal').classList.add('hidden');
        Helpers.showToast('Rutina añadida ✓');
        App.renderCurrentPage();
    },

    viewRoutine(id) {
        const routines = Storage.getRoutines();
        this.selectedRoutine = routines.find(r => r.id === id);
        this.currentView = 'detail';
        App.renderCurrentPage();
    },

    backToList() {
        this.currentView = 'list';
        this.selectedRoutine = null;
        App.renderCurrentPage();
    },

    deleteRoutine(id) {
        if (confirm('¿Eliminar esta rutina?')) {
            Storage.deleteRoutine(id);
            this.backToList();
            Helpers.showToast('Rutina eliminada');
        }
    },

    createRoutine() {
        this.generateAIRoutine();
    },

    // Execution
    startExecution(routineId, dayIndex) {
        const routines = Storage.getRoutines();
        const routine = routines.find(r => r.id === routineId);
        if (!routine) return;

        const day = routine.days[dayIndex];
        this.executionState = {
            routineId,
            dayIndex,
            dayName: day.name,
            exercises: day.exercises,
            currentExerciseIndex: 0,
            completedSets: {},
            weights: {},
            reps: {},
            elapsedTime: 0,
            startTime: Date.now()
        };

        this.currentView = 'execute';
        this.startTimer();
        App.renderCurrentPage();
    },

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.executionState) {
                this.executionState.elapsedTime = Math.floor((Date.now() - this.executionState.startTime) / 1000);
                const timerEl = document.getElementById('workout-timer');
                if (timerEl) timerEl.textContent = Helpers.formatTime(this.executionState.elapsedTime);
            }
        }, 1000);
    },

    completeSet(setIndex) {
        const state = this.executionState;
        const exIdx = state.currentExerciseIndex;

        if (!state.completedSets[exIdx]) state.completedSets[exIdx] = {};
        if (!state.weights[exIdx]) state.weights[exIdx] = {};
        if (!state.reps[exIdx]) state.reps[exIdx] = {};

        const weightInput = document.getElementById(`weight-${setIndex}`);
        const repsInput = document.getElementById(`reps-${setIndex}`);

        state.weights[exIdx][setIndex] = parseFloat(weightInput?.value) || 0;
        state.reps[exIdx][setIndex] = parseInt(repsInput?.value) || 0;
        state.completedSets[exIdx][setIndex] = true;

        // Check PR
        const currentEx = state.exercises[exIdx];
        const exId = typeof currentEx === 'string' ? currentEx : currentEx.id;
        const weight = state.weights[exIdx][setIndex];
        if (weight > 0 && Storage.updatePR(exId, weight)) {
            Helpers.showToast('🎉 ¡NUEVO RECORD PERSONAL! 🏆');
        }

        // Start rest timer
        this.startRestTimer();
        App.renderCurrentPage();
    },

    startRestTimer() {
        const container = document.getElementById('rest-timer-container');
        if (!container) return;
        container.classList.remove('hidden');

        const currentEx = this.executionState.exercises[this.executionState.currentExerciseIndex];
        const exercise = typeof currentEx === 'string' ? EXERCISES_DB.find(e => e.id === currentEx) : currentEx;
        let restTime = exercise ? exercise.rest : 60;

        this.restInterval = setInterval(() => {
            restTime--;
            const el = document.getElementById('rest-timer-value');
            if (el) el.textContent = Helpers.formatTime(restTime);
            if (restTime <= 0) {
                this.skipRest();
            }
        }, 1000);
    },

    skipRest() {
        clearInterval(this.restInterval);
        const container = document.getElementById('rest-timer-container');
        if (container) container.classList.add('hidden');
    },

    nextExercise() {
        const state = this.executionState;
        if (state.currentExerciseIndex >= state.exercises.length - 1) {
            this.finishWorkout();
            return;
        }
        this.skipRest();
        state.currentExerciseIndex++;
        App.renderCurrentPage();
    },

    prevExercise() {
        if (this.executionState.currentExerciseIndex > 0) {
            this.skipRest();
            this.executionState.currentExerciseIndex--;
            App.renderCurrentPage();
        }
    },

    finishWorkout() {
        const state = this.executionState;
        clearInterval(this.timerInterval);
        clearInterval(this.restInterval);

        // Calculate total volume
        let totalVolume = 0;
        Object.keys(state.weights).forEach(exIdx => {
            Object.keys(state.weights[exIdx]).forEach(setIdx => {
                const w = state.weights[exIdx][setIdx] || 0;
                const r = state.reps[exIdx] ? state.reps[exIdx][setIdx] || 0 : 0;
                totalVolume += w * r;
            });
        });

        const workout = {
            routineId: state.routineId,
            dayName: state.dayName,
            duration: Math.round(state.elapsedTime / 60),
            totalVolume: Math.round(totalVolume),
            exercises: state.exercises.length,
            completedSets: state.completedSets,
            weights: state.weights,
            reps: state.reps
        };

        Storage.addWorkout(workout);
        this.executionState = null;
        this.currentView = 'list';
        Helpers.showToast('🎉 ¡Entrenamiento completado! Volumen: ' + Math.round(totalVolume) + 'kg');
        App.renderCurrentPage();
    },

    exitExecution() {
        if (confirm('¿Salir del entrenamiento? Se perderá el progreso.')) {
            clearInterval(this.timerInterval);
            clearInterval(this.restInterval);
            this.executionState = null;
            this.currentView = 'list';
            App.renderCurrentPage();
        }
    }
};
