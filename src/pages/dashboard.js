// ===== DASHBOARD PAGE =====
const DashboardPage = {
    render() {
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];
        const workouts = Storage.getWorkoutHistory();
        const weekDays = Helpers.getWeekDays();
        const todayWorkouts = workouts.filter(w => 
            new Date(w.date).toDateString() === new Date().toDateString()
        );

        // Calculate weekly stats
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const thisWeekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart);
        const totalVolume = thisWeekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        const streak = this.calculateStreak(workouts);

        return `
        <div class="animate-fade">
            <!-- Greeting -->
            <div class="mb-3">
                <h2 style="font-size: 1.4rem; font-weight: 700;">
                    ${Helpers.getGreeting()}, ${profile.name || 'Atleta'} 👋
                </h2>
                <p class="text-secondary" style="margin-top: 0.3rem;">
                    Semana ${week}/12 • Fase: ${periodWeek.phase} • RPE ${periodWeek.rpe}
                </p>
            </div>

            <!-- Week Calendar -->
            <div class="week-calendar">
                ${weekDays.map(day => `
                    <div class="week-day ${day.isToday ? 'active' : ''} ${this.hasWorkout(workouts, day.date) ? 'completed' : ''}">
                        <div class="day-name">${day.name}</div>
                        <div class="day-number">${day.number}</div>
                        ${this.hasWorkout(workouts, day.date) ? '<div class="day-dot"></div>' : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Stats Grid -->
            <div class="stat-grid">
                <div class="stat-card">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${streak}</div>
                    <div class="stat-label">Racha (días)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💪</div>
                    <div class="stat-value">${thisWeekWorkouts.length}/${profile.daysPerWeek || 4}</div>
                    <div class="stat-label">Sesiones semana</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏋️</div>
                    <div class="stat-value">${totalVolume > 1000 ? (totalVolume/1000).toFixed(1) + 'k' : totalVolume}</div>
                    <div class="stat-label">Volumen (kg)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-value">${periodWeek.intensity}%</div>
                    <div class="stat-label">Intensidad</div>
                </div>
            </div>

            <!-- Program Progress -->
            <div class="card mb-3">
                <div class="card-header">
                    <span class="card-title">📊 Progreso del Programa</span>
                    <span class="badge badge-primary">${periodWeek.phase}</span>
                </div>
                <div class="progress-bar" style="height: 10px; margin-bottom: 0.5rem;">
                    <div class="progress-fill primary" style="width: ${Math.round(week/12*100)}%"></div>
                </div>
                <div class="flex justify-between">
                    <span class="text-muted" style="font-size: 0.75rem;">Semana ${week}</span>
                    <span class="text-muted" style="font-size: 0.75rem;">${Math.round(week/12*100)}% completado</span>
                </div>
                ${periodWeek.deload ? '<p class="text-success mt-1" style="font-size: 0.8rem;">🟢 Semana de deload - Reduce intensidad y recupera</p>' : ''}
            </div>

            <!-- Today's Plan -->
            <div class="card mb-3">
                <div class="card-header">
                    <span class="card-title">📋 Hoy</span>
                    ${todayWorkouts.length > 0 ? '<span class="badge badge-success">✓ Completado</span>' : '<span class="badge badge-warning">Pendiente</span>'}
                </div>
                ${todayWorkouts.length > 0 ? `
                    <p class="text-success" style="font-size: 0.9rem;">¡Ya entrenaste hoy! 🎉</p>
                    <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.3rem;">Duración: ${todayWorkouts[0].duration || '?'} min | Volumen: ${todayWorkouts[0].totalVolume || 0}kg</p>
                ` : `
                    <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1rem;">
                        ${this.getTodayMessage(profile, week)}
                    </p>
                    <button class="btn btn-primary btn-full" onclick="App.navigate('routines')">
                        💪 Empezar Entrenamiento
                    </button>
                `}
            </div>

            <!-- Quick Actions -->
            <div class="section-header">
                <span class="section-title">⚡ Acciones Rápidas</span>
            </div>
            <div class="grid-2 gap-2">
                <button class="btn btn-secondary btn-full" onclick="App.navigate('ai-coach')">
                    🤖 Preguntar a IA
                </button>
                <button class="btn btn-secondary btn-full" onclick="App.navigate('progress')">
                    📈 Ver Progreso
                </button>
                <button class="btn btn-secondary btn-full" onclick="App.navigate('nutrition')">
                    🥗 Plan Nutrición
                </button>
                <button class="btn btn-secondary btn-full" onclick="App.navigate('exercises')">
                    📚 Ejercicios
                </button>
            </div>

            <!-- Motivation -->
            <div class="card mt-3" style="background: linear-gradient(135deg, rgba(108,99,255,0.1), rgba(78,205,196,0.1)); border-color: var(--primary);">
                <p style="font-size: 0.9rem; font-style: italic; text-align: center;">
                    "${this.getRandomQuote()}"
                </p>
            </div>
        </div>`;
    },

    hasWorkout(workouts, dateStr) {
        return workouts.some(w => new Date(w.date).toDateString() === new Date(dateStr).toDateString());
    },

    calculateStreak(workouts) {
        if (workouts.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const hasWorkout = workouts.some(w => 
                new Date(w.date).toDateString() === checkDate.toDateString()
            );
            if (hasWorkout) streak++;
            else if (i > 0) break;
        }
        return streak;
    },

    getTodayMessage(profile, week) {
        const dayOfWeek = new Date().getDay();
        const daysPerWeek = profile.daysPerWeek || 4;
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return daysPerWeek >= 6 ? 'Día de entrenamiento. ¡Vamos!' : 'Hoy es día de descanso activo. Camina, estira.';
        }
        return 'Tienes un entrenamiento programado. ¡Dale con todo!';
    },

    getRandomQuote() {
        const quotes = [
            'El dolor que sientes hoy es la fuerza que sentirás mañana.',
            'No cuentes los días, haz que los días cuenten.',
            'Tu único límite eres tú mismo.',
            'El éxito no es dado, se gana. En el gym y en la vida.',
            'Cada repetición te acerca a tu mejor versión.',
            'La disciplina supera a la motivación, siempre.',
            'No te detengas cuando estés cansado, detente cuando termines.',
            'El cuerpo logra lo que la mente cree.'
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }
};
