// ===== FITNESS TOOLS =====
const FitnessTools = {
    // ===== SOMATOTYPE IDENTIFIER =====
    getSomatotype(profile) {
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const bmi = weight / ((height/100)**2);
        const wrist = profile.wrist || (height * 0.094); // estimate wrist circumference
        const frameSize = wrist / (height / 100); // frame index
        
        let type, description, training, nutrition;
        
        if (bmi < 20 && frameSize < 0.1) {
            type = 'Ectomorfo';
            description = 'Cuerpo delgado, huesos finos, metabolismo rápido. Te cuesta ganar peso y músculo.';
            training = [
                'Entrena pesado con pocos ejercicios (4-5 por sesión)',
                'Prioriza compuestos: sentadilla, press, peso muerto',
                'Descanso largo: 2-3 min entre series',
                'Limita el cardio (máximo 2 sesiones ligeras/semana)',
                'Sesiones cortas: 45-60 min máximo',
                'Frecuencia: 3-4 días/semana'
            ];
            nutrition = [
                'Superávit ALTO: +500-700 kcal sobre mantenimiento',
                'Calorías: ' + Math.round(weight * 40) + ' kcal/día',
                'Proteína: ' + Math.round(weight * 2) + 'g/día',
                'Carbos ALTOS: ' + Math.round(weight * 5) + 'g/día',
                'Come cada 2.5-3 horas (no te saltes comidas)',
                'Batidos de masa (avena + whey + plátano + mantequilla maní)',
                'No temas a los carbos - son tu combustible'
            ];
        } else if (bmi > 26 || frameSize > 0.115) {
            type = 'Endomorfo';
            description = 'Cuerpo ancho, tiende a acumular grasa fácilmente. Buena base muscular pero cubierta de grasa.';
            training = [
                'Combina pesas + cardio (4 pesas + 3 cardio/semana)',
                'Circuitos y supersets para mantener FC elevada',
                'Cardio LISS: 30-45 min post-entreno 3-4x/semana',
                'Volumen alto de entrenamiento (más series, menos descanso)',
                'Descanso corto: 45-75 seg entre series',
                'HIIT 1-2x/semana'
            ];
            nutrition = [
                'Déficit moderado: -400 a -500 kcal',
                'Calorías: ' + Math.round(weight * 24) + ' kcal/día',
                'Proteína MUY alta: ' + Math.round(weight * 2.4) + 'g/día',
                'Carbos bajos-moderados: ' + Math.round(weight * 2) + 'g/día',
                'Grasas moderadas: ' + Math.round(weight * 0.8) + 'g/día',
                'Carbos solo en desayuno y post-entreno',
                'Evita carbos simples y azúcares',
                'Ayuno intermitente puede funcionar bien para ti'
            ];
        } else {
            type = 'Mesomorfo';
            description = 'Cuerpo atlético natural, gana músculo fácil y no acumula mucha grasa. El tipo más afortunado genéticamente.';
            training = [
                'Puedes entrenar con variedad (tu cuerpo responde a todo)',
                'Mezcla fuerza (5-8 reps) + hipertrofia (8-12) + pump (12-20)',
                '4-5 días/semana es ideal',
                'Puedes manejar más volumen que otros tipos',
                'Periodización ondulante funciona genial',
                'Cardio moderado: 2-3 sesiones/semana'
            ];
            nutrition = [
                'Mantenimiento o ligero superávit: +200-300 kcal',
                'Calorías: ' + Math.round(weight * 32) + ' kcal/día',
                'Proteína: ' + Math.round(weight * 2) + 'g/día',
                'Carbos moderados-altos: ' + Math.round(weight * 3.5) + 'g/día',
                'Distribución equilibrada 40/30/30 (C/P/G)',
                'Puedes ser más flexible con la dieta',
                'Tu cuerpo perdona errores mejor que los otros tipos'
            ];
        }
        
        return { type, description, training, nutrition };
    },

    // ===== 1RM ESTIMATOR =====
    calculate1RM(weight, reps) {
        if (reps === 1) return weight;
        // Brzycki formula (most accurate for 1-10 reps)
        return Math.round(weight * (36 / (37 - reps)));
    },

    // Get percentage recommendations
    getPercentages(oneRM) {
        return {
            '100%': { weight: oneRM, reps: 1, use: 'Test de máximo' },
            '95%': { weight: Math.round(oneRM * 0.95), reps: 2, use: 'Fuerza máxima' },
            '90%': { weight: Math.round(oneRM * 0.90), reps: 3, use: 'Fuerza' },
            '85%': { weight: Math.round(oneRM * 0.85), reps: 5, use: 'Fuerza-Hipertrofia' },
            '80%': { weight: Math.round(oneRM * 0.80), reps: 8, use: 'Hipertrofia' },
            '75%': { weight: Math.round(oneRM * 0.75), reps: 10, use: 'Hipertrofia' },
            '70%': { weight: Math.round(oneRM * 0.70), reps: 12, use: 'Hipertrofia-Resistencia' },
            '65%': { weight: Math.round(oneRM * 0.65), reps: 15, use: 'Resistencia muscular' },
            '60%': { weight: Math.round(oneRM * 0.60), reps: 20, use: 'Calentamiento/Deload' },
        };
    },

    // ===== REST TIMER =====
    restTimer: {
        interval: null,
        remaining: 0,
        isRunning: false,
        
        start(seconds) {
            this.stop();
            this.remaining = seconds;
            this.isRunning = true;
            this.updateDisplay();
            this.interval = setInterval(() => {
                this.remaining--;
                this.updateDisplay();
                if (this.remaining <= 0) {
                    this.stop();
                    this.alarm();
                }
            }, 1000);
        },
        
        stop() {
            if (this.interval) clearInterval(this.interval);
            this.isRunning = false;
            this.interval = null;
        },
        
        alarm() {
            // Vibrate if available
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            Helpers.showToast('⏱️ ¡Descanso terminado! Siguiente serie 💪');
        },
        
        updateDisplay() {
            const el = document.getElementById('rest-timer-display');
            if (el) {
                const mins = Math.floor(this.remaining / 60);
                const secs = this.remaining % 60;
                el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
                el.style.color = this.remaining <= 5 ? 'var(--danger)' : 'var(--accent)';
            }
        },
        
        render() {
            return `
                <div class="rest-timer-widget" id="rest-timer-widget">
                    <span id="rest-timer-display" style="font-size: 1.5rem; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums;">
                        ${this.isRunning ? Math.floor(this.remaining/60) + ':' + (this.remaining%60).toString().padStart(2,'0') : '0:00'}
                    </span>
                    <div style="display: flex; gap: 0.3rem; margin-top: 0.5rem;">
                        <button class="btn btn-sm btn-secondary" onclick="FitnessTools.restTimer.start(60)">60s</button>
                        <button class="btn btn-sm btn-secondary" onclick="FitnessTools.restTimer.start(90)">90s</button>
                        <button class="btn btn-sm btn-secondary" onclick="FitnessTools.restTimer.start(120)">2m</button>
                        <button class="btn btn-sm btn-secondary" onclick="FitnessTools.restTimer.start(180)">3m</button>
                        <button class="btn btn-sm btn-danger" onclick="FitnessTools.restTimer.stop()" style="padding: 0.4rem 0.6rem;">✕</button>
                    </div>
                </div>
            `;
        }
    },

    // ===== EXERCISE WEIGHT HISTORY =====
    getExerciseHistory(exerciseId) {
        const workouts = Storage.getWorkoutHistory();
        const history = [];
        workouts.forEach(w => {
            if (w.weights && w.weights[exerciseId]) {
                Object.values(w.weights[exerciseId]).forEach(weight => {
                    if (weight > 0) history.push({ weight, date: w.date });
                });
            }
        });
        return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    getLastWeight(exerciseId) {
        const history = this.getExerciseHistory(exerciseId);
        return history.length > 0 ? history[0].weight : null;
    },

    // ===== WORKOUT NOTES =====
    saveNote(date, note) {
        const notes = JSON.parse(localStorage.getItem('fitai_workout_notes') || '{}');
        notes[date] = note;
        localStorage.setItem('fitai_workout_notes', JSON.stringify(notes));
    },

    getNote(date) {
        const notes = JSON.parse(localStorage.getItem('fitai_workout_notes') || '{}');
        return notes[date] || '';
    },

    // ===== QUICK WORKOUT =====
    quickWorkout: {
        active: false,
        exercises: [],
        startTime: null,

        start() {
            this.active = true;
            this.exercises = [];
            this.startTime = Date.now();
            Helpers.showToast('⚡ Entrenamiento rápido iniciado');
        },

        addExercise(name, sets, reps, weight) {
            this.exercises.push({ name, sets, reps, weight, time: Date.now() });
        },

        finish() {
            const duration = Math.round((Date.now() - this.startTime) / 60000);
            const totalVolume = this.exercises.reduce((sum, ex) => sum + (ex.weight * ex.reps * ex.sets), 0);
            
            Storage.addWorkout({
                dayName: 'Entrenamiento Rápido',
                duration,
                totalVolume: Math.round(totalVolume),
                exercises: this.exercises.length,
                type: 'quick'
            });

            this.active = false;
            Helpers.showToast(`🎉 Entrenamiento guardado: ${duration}min, ${Math.round(totalVolume)}kg volumen`);
            return { duration, totalVolume, exercises: this.exercises.length };
        }
    },

    // ===== SHARE PROGRESS =====
    generateShareText(profile) {
        const workouts = Storage.getWorkoutHistory().length;
        const prs = Object.keys(Storage.getPRs()).length;
        const week = Storage.getCurrentWeek();
        
        return `🏋️ Mi progreso en FitAI:\n\n` +
            `📅 Semana ${week}/12\n` +
            `💪 ${workouts} entrenamientos completados\n` +
            `🏆 ${prs} records personales\n` +
            `🎯 Objetivo: ${profile.goal || 'Mejorar mi físico'}\n\n` +
            `#FitAI #Fitness #GymLife 💪🔥`;
    },

    shareProgress() {
        const profile = Storage.getProfile();
        const text = this.generateShareText(profile);
        
        if (navigator.share) {
            navigator.share({ title: 'Mi Progreso FitAI', text });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                Helpers.showToast('📋 Texto copiado al portapapeles');
            });
        }
    }
};
