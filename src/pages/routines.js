// ===== ROUTINES PAGE =====
const RoutinesPage = {
    currentView: 'list', // list, detail, execute, builder
    selectedRoutine: null,
    executionState: null,

    render() {
        if (RoutineBuilder.isOpen) {
            return RoutineBuilder.render();
        }
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
                <h2 style="font-size: 1.3rem; font-weight: 700;"> Mis Rutinas</h2>
                <button class="btn btn-primary btn-sm" onclick="RoutinesPage.createRoutine()">+ Crear</button>
            </div>

            <!-- Current Phase Info -->
            <div class="card mb-3" style="border-color: var(--primary);">
                <div class="flex items-center gap-2">
                    <span style="font-size: 1.5rem;"></span>
                    <div>
                        <p style="font-weight: 600; font-size: 0.9rem;">Semana ${week} - ${periodWeek.phase}</p>
                        <p class="text-muted" style="font-size: 0.8rem;">Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe} ${periodWeek.deload ? '| 🟢 DELOAD' : ''}</p>
                    </div>
                </div>
            </div>

            ${routines.length === 0 ? `
                <div class="card text-center" style="padding: 3rem 1.5rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;"></div>
                    <h3 style="margin-bottom: 0.5rem;">No tienes rutinas aún</h3>
                    <p class="text-secondary mb-3" style="font-size: 0.9rem;">Crea tu rutina personalizada, usa IA o elige una plantilla</p>
                    <div class="flex flex-col gap-2">
                        <button class="btn btn-accent btn-full" onclick="RoutineBuilder.open()">
                            🏗️ Crear mi Rutina (Muñeco Interactivo)
                        </button>
                        <button class="btn btn-primary btn-full" onclick="RoutinesPage.generateAIRoutine()">
                            🤖 Generar con IA
                        </button>
                        <button class="btn btn-secondary btn-full" onclick="RoutinesPage.showTemplates()">
                             Usar Plantilla
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
                            <span> ${routine.days ? routine.days.length : '?'}x/semana</span>
                            <span>⏱️ ~60 min</span>
                            <span> ${routine.phase || periodWeek.phase}</span>
                        </div>
                    </div>
                `).join('')}

                <div class="mt-3 flex flex-col gap-2">
                    <button class="btn btn-accent btn-full" onclick="RoutineBuilder.open()">
                        🏗️ Crear Rutina Personalizada
                    </button>
                    <button class="btn btn-primary btn-full" onclick="RoutinesPage.generateAIRoutine()">
                        🤖 Generar con IA
                    </button>
                    <button class="btn btn-secondary btn-full" onclick="RoutinesPage.showTemplates()">
                         Usar Plantilla
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
                                    <span style="font-size: 1.1rem;">${exercise.icon || ''}</span>
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
        const pr = exercise ? Storage.getPRs()[exercise.id] : null;
        const profile = Storage.getProfile();
        const suggestedWeight = pr ? Math.round(pr.weight * 0.8) : Math.round((profile.weight||70) * (exercise && exercise.category==='compound'?0.5:0.2));

        return `
        <div class="animate-fade">
            <div class="flex justify-between items-center mb-3">
                <button class="btn btn-ghost btn-sm" onclick="RoutinesPage.exitExecution()">Salir</button>
                <span class="badge badge-primary">${state.currentExerciseIndex + 1}/${state.exercises.length}</span>
            </div>

            <!-- Progress -->
            <div class="progress-bar mb-2" style="height: 4px;">
                <div class="progress-fill primary" style="width: ${Math.round((state.currentExerciseIndex / state.exercises.length) * 100)}%"></div>
            </div>

            <!-- Timer -->
            <div style="text-align:center;margin-bottom:0.75rem;">
                <span id="workout-timer" style="font-size:1.8rem;font-weight:800;color:var(--primary);font-variant-numeric:tabular-nums">${Helpers.formatTime(state.elapsedTime)}</span>
            </div>

            <!-- Exercise GIF -->
            ${exercise && exercise.gifUrl ? `
                <div style="background:#0a0a0a;border-radius:var(--radius-lg);overflow:hidden;margin-bottom:0.75rem;border:1px solid var(--border);position:relative;min-height:140px;">
                    <img src="${exercise.gifUrl}" alt="${exercise.name}" style="width:100%;max-height:220px;object-fit:contain;display:block;margin:0 auto" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'padding:1rem;text-align:center;color:var(--text-muted);font-size:0.78rem;\\'><svg width=\\'40\\' height=\\'40\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'%2322C55E\\' stroke-width=\\'2\\' style=\\'margin:0 auto 0.5rem;display:block\\'><path d=\\'M6.5 6.5h11M6.5 17.5h11M4 6.5a2.5 2.5 0 1 1 0 5M4 12.5a2.5 2.5 0 1 0 0 5M20 6.5a2.5 2.5 0 1 0 0 5M20 12.5a2.5 2.5 0 1 1 0 5M6.5 6.5v11M17.5 6.5v11\\'/></svg>${exercise.name}<br>${exercise.muscle} | ${exercise.sets}x${exercise.reps}</div>'">
                </div>
            ` : ''}

            <!-- Current Exercise Info -->
            <div class="exercise-execution">
                <div style="margin-bottom:0.75rem">
                    <h3 style="font-size:1rem;font-weight:700;letter-spacing:-0.02em">${exercise ? exercise.name : 'Ejercicio'}</h3>
                    <p style="font-size:0.72rem;color:var(--text-muted);margin-top:0.15rem">${exercise ? exercise.muscle : ''} | Descanso: ${exercise ? exercise.rest : 60}s | ${exercise ? exercise.reps : ''} reps</p>
                </div>

                <!-- Weight suggestion -->
                <div style="background:var(--primary-glow);border:1px solid rgba(34,197,94,0.2);border-radius:8px;padding:0.5rem 0.7rem;margin-bottom:0.75rem;font-size:0.72rem;color:var(--primary)">
                    Peso sugerido: <strong>${suggestedWeight}kg</strong>${pr ? ' (80% de PR: '+pr.weight+'kg)' : ' (estimado inicial)'} | Sobrecarga: +2.5kg cuando completes todas las reps
                </div>

                ${exercise && exercise.tips ? `
                    <div style="background:var(--bg-surface);border-radius:8px;padding:0.45rem 0.65rem;margin-bottom:0.75rem;font-size:0.7rem;color:var(--text-secondary)">
                        ${exercise.tips[0]}
                    </div>
                ` : ''}

                <!-- Sets -->
                <div id="sets-container">
                    ${Array.from({length: exercise ? exercise.sets : 3}, (_, i) => `
                        <div class="set-row">
                            <div class="set-number ${state.completedSets[state.currentExerciseIndex] && state.completedSets[state.currentExerciseIndex][i] ? 'completed' : ''}">${i + 1}</div>
                            <div class="set-inputs">
                                <div>
                                    <label style="font-size: 0.6rem; color: var(--text-muted);">kg</label>
                                    <input type="number" class="set-input" id="weight-${i}" placeholder="${suggestedWeight}" value="${state.weights[state.currentExerciseIndex] ? state.weights[state.currentExerciseIndex][i] || '' : ''}">
                                </div>
                                <div>
                                    <label style="font-size: 0.6rem; color: var(--text-muted);">reps</label>
                                    <input type="number" class="set-input" id="reps-${i}" placeholder="${exercise?exercise.reps:''}" value="${state.reps[state.currentExerciseIndex] ? state.reps[state.currentExerciseIndex][i] || '' : ''}">
                                </div>
                            </div>
                            <button class="btn btn-primary btn-sm" style="min-width:32px" onclick="RoutinesPage.completeSet(${i})" ${state.completedSets[state.currentExerciseIndex] && state.completedSets[state.currentExerciseIndex][i] ? 'disabled style="opacity:0.3;min-width:32px"' : ''}>
                                OK
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Rest Timer -->
            <div id="rest-timer-container" class="hidden">
                <div class="card text-center" style="border-color: var(--primary);margin-top:0.75rem">
                    <p style="font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.3rem;">Descanso</p>
                    <div id="rest-timer-value" style="font-size: 2rem; font-weight: 800; color: var(--primary);font-variant-numeric:tabular-nums">00:00</div>
                    <button class="btn btn-ghost btn-sm mt-1" onclick="RoutinesPage.skipRest()">Saltar</button>
                </div>
            </div>

            <!-- Navigation -->
            <div class="flex gap-2 mt-2">
                <button class="btn btn-ghost" onclick="RoutinesPage.prevExercise()" ${state.currentExerciseIndex === 0 ? 'disabled style="opacity:0.3"' : ''}>
                    Anterior
                </button>
                <button class="btn btn-primary" style="flex:1;" onclick="RoutinesPage.nextExercise()">
                    ${state.currentExerciseIndex === state.exercises.length - 1 ? 'Finalizar' : 'Siguiente'}
                </button>
            </div>
        </div>`;
    },

    // Actions
    generateAIRoutine() {
        const profile = Storage.getProfile();
        const routine = AIEngine.generateCustomRoutine(profile);
        if (routine && routine.id) {
            Storage.saveRoutine(routine);
            Helpers.showToast('Rutina generada con IA!');
            App.renderCurrentPage();
        } else {
            Helpers.showToast('Error al generar rutina', 'error');
        }
    },

    showTemplates() {
        const modal = document.getElementById('onboarding-modal');
        modal.classList.remove('hidden');
        document.getElementById('onboarding-steps').innerHTML = `
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;"> Plantillas de Rutina</h2>
            ${Object.entries(ROUTINE_TEMPLATES).map(([key, tmpl]) => `
                <div class="workout-card" onclick="RoutinesPage.useTemplate('${key}')">
                    <div class="workout-title">${tmpl.name}</div>
                    <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.3rem;">${tmpl.description}</p>
                    <div class="workout-meta mt-1">
                        <span>📆 ${tmpl.frequency} días</span>
                        <span>⏱️ ${tmpl.duration}</span>
                        <span> ${tmpl.level}</span>
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
        RoutineBuilder.open();
    },

    generateMuscleRoutine(muscle) {
        const exercises = EXERCISES_DB.filter(e => e.muscle === muscle).slice(0, 6);
        if (exercises.length === 0) return;
        const routine = {
            id: Helpers.generateId(),
            name: `Rutina de ${muscle}`,
            description: `Rutina enfocada en ${muscle} - Generada por IA`,
            days: [{ name: muscle, exercises: exercises.map(e => e.id) }],
            createdAt: new Date().toISOString()
        };
        Storage.saveRoutine(routine);
        document.getElementById('onboarding-modal').classList.add('hidden');
        Helpers.showToast(`✅ Rutina de ${muscle} creada!`);
        App.renderCurrentPage();
    },

    // Execution
    startExecution(routineId, dayIndex) {
        const routines = Storage.getRoutines();
        const routine = routines.find(r => r.id === routineId);
        if (!routine) {
            Helpers.showToast('Rutina no encontrada', 'error');
            return;
        }

        const day = routine.days[dayIndex];
        if (!day || !day.exercises || day.exercises.length === 0) {
            Helpers.showToast('Este dia no tiene ejercicios', 'error');
            return;
        }

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
            Helpers.showToast('🎉 ¡NUEVO RECORD PERSONAL! ');
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
        let totalSetsCompleted = 0;
        Object.keys(state.weights).forEach(exIdx => {
            Object.keys(state.weights[exIdx]).forEach(setIdx => {
                const w = state.weights[exIdx][setIdx] || 0;
                const r = state.reps[exIdx] ? state.reps[exIdx][setIdx] || 0 : 0;
                totalVolume += w * r;
                if (w > 0 && r > 0) totalSetsCompleted++;
            });
        });

        // Build exercise names for history
        const exerciseNames = state.exercises.map(ex => {
            const exercise = typeof ex === 'string' ? EXERCISES_DB.find(e => e.id === ex) : ex;
            return exercise ? exercise.name : 'Ejercicio';
        });

        const workout = {
            id: Helpers.generateId(),
            routineId: state.routineId,
            dayName: state.dayName,
            duration: Math.round(state.elapsedTime / 60),
            totalVolume: Math.round(totalVolume),
            exercises: state.exercises.length,
            exerciseNames: exerciseNames,
            completedSets: totalSetsCompleted,
            weights: state.weights,
            reps: state.reps
        };

        Storage.addWorkout(workout);
        this.executionState = null;
        this.currentView = 'list';
        
        const msg = totalVolume > 0 
            ? `Entrenamiento completado! Volumen: ${Math.round(totalVolume)}kg | ${totalSetsCompleted} series | ${Math.round(state.elapsedTime/60)} min`
            : `Entrenamiento completado! ${Math.round(state.elapsedTime/60)} minutos`;
        Helpers.showToast(msg);
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
