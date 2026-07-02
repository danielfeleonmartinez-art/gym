// ===== GOALS & CALENDAR PAGE =====
const GoalsPage = {
    activeTab: 'calendar',
    selectedDate: new Date().toISOString().split('T')[0],
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),

    render() {
        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">🎯 Metas & Calendario</h2>

            <div class="tabs">
                <button class="tab ${this.activeTab === 'calendar' ? 'active' : ''}" onclick="GoalsPage.setTab('calendar')">📅 Calendario</button>
                <button class="tab ${this.activeTab === 'goals' ? 'active' : ''}" onclick="GoalsPage.setTab('goals')">🎯 Metas</button>
                <button class="tab ${this.activeTab === 'milestones' ? 'active' : ''}" onclick="GoalsPage.setTab('milestones')">🏆 Logros</button>
            </div>

            ${this.activeTab === 'calendar' ? this.renderCalendar() : ''}
            ${this.activeTab === 'goals' ? this.renderGoals() : ''}
            ${this.activeTab === 'milestones' ? this.renderMilestones() : ''}
        </div>`;
    },

    renderCalendar() {
        const month = this.currentMonth;
        const year = this.currentYear;
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDay = (firstDay.getDay() + 6) % 7;
        const totalDays = lastDay.getDate();

        const workouts = Storage.getWorkoutHistory();
        const goals = Storage.getGoals();
        const today = new Date().toISOString().split('T')[0];

        // Build calendar grid
        let days = [];
        for (let i = 0; i < startDay; i++) days.push(null);
        for (let d = 1; d <= totalDays; d++) days.push(d);

        return `
            <!-- Month Navigation -->
            <div class="calendar-header">
                <button class="icon-btn" onclick="GoalsPage.prevMonth()">◀</button>
                <h3 class="calendar-month">${monthNames[month]} ${year}</h3>
                <button class="icon-btn" onclick="GoalsPage.nextMonth()">▶</button>
            </div>

            <!-- Day Names -->
            <div class="calendar-grid calendar-day-names">
                ${dayNames.map(d => `<span class="cal-day-name">${d}</span>`).join('')}
            </div>

            <!-- Calendar Days -->
            <div class="calendar-grid calendar-days">
                ${days.map(day => {
                    if (!day) return '<span class="cal-day empty"></span>';
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const hasWorkout = workouts.some(w => w.date && w.date.startsWith(dateStr));
                    const hasGoal = goals.some(g => g.date === dateStr);
                    const isToday = dateStr === today;
                    const isSelected = dateStr === this.selectedDate;
                    const isPast = new Date(dateStr) < new Date(today);

                    return `
                        <span class="cal-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasWorkout ? 'workout' : ''} ${hasGoal ? 'has-goal' : ''} ${isPast && !hasWorkout ? 'missed' : ''}"
                            onclick="GoalsPage.selectDate('${dateStr}')">
                            ${day}
                            ${hasWorkout ? '<span class="cal-dot workout-dot"></span>' : ''}
                            ${hasGoal ? '<span class="cal-dot goal-dot"></span>' : ''}
                        </span>
                    `;
                }).join('')}
            </div>

            <!-- Selected Date Info -->
            <div class="card mt-3">
                <h4 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem;">
                    📅 ${this.formatDate(this.selectedDate)}
                </h4>
                ${this.renderDateInfo(this.selectedDate, workouts, goals)}
            </div>

            <!-- Quick Stats -->
            <div class="stat-grid mt-3">
                <div class="stat-card">
                    <div class="stat-icon">🔥</div>
                    <div class="stat-value">${this.getMonthWorkouts(workouts, month, year)}</div>
                    <div class="stat-label">Entrenos este mes</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📊</div>
                    <div class="stat-value">${this.getAdherence(workouts, month, year)}%</div>
                    <div class="stat-label">Adherencia</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🏆</div>
                    <div class="stat-value">${this.getStreak(workouts)}</div>
                    <div class="stat-label">Racha días</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-value">${goals.filter(g => g.completed).length}/${goals.length}</div>
                    <div class="stat-label">Metas logradas</div>
                </div>
            </div>
        `;
    },

    renderGoals() {
        const goals = Storage.getGoals();
        const profile = Storage.getProfile();

        return `
            <!-- Add Goal -->
            <div class="card mb-3" style="border-color: var(--primary);">
                <h3 class="card-title mb-2">➕ Nueva Meta</h3>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <input type="text" class="form-input" id="goal-desc" placeholder="Ej: Hacer bench press 100kg, Perder 5kg...">
                </div>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Categoría</label>
                        <select class="form-select" id="goal-category">
                            <option value="fuerza">💪 Fuerza (PR)</option>
                            <option value="peso">⚖️ Peso corporal</option>
                            <option value="habito">🔄 Hábito</option>
                            <option value="medida">📐 Medida</option>
                            <option value="nutricion">🥗 Nutrición</option>
                            <option value="otro">🎯 Otro</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Fecha límite</label>
                        <input type="date" class="form-input" id="goal-deadline">
                    </div>
                </div>
                <div class="grid-2 gap-1">
                    <div class="form-group">
                        <label class="form-label">Valor actual</label>
                        <input type="number" class="form-input" id="goal-current" placeholder="70" step="0.5">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Valor objetivo</label>
                        <input type="number" class="form-input" id="goal-target" placeholder="80" step="0.5">
                    </div>
                </div>
                <button class="btn btn-primary btn-full" onclick="GoalsPage.addGoal()">
                    🎯 Crear Meta
                </button>
            </div>

            <!-- Active Goals -->
            <div class="section-header">
                <span class="section-title">📋 Mis Metas Activas</span>
            </div>
            ${goals.filter(g => !g.completed).length === 0 ? `
                <p class="text-muted text-center" style="padding: 2rem;">No tienes metas activas. ¡Crea una arriba!</p>
            ` : goals.filter(g => !g.completed).map(goal => this.renderGoalCard(goal)).join('')}

            <!-- Completed Goals -->
            ${goals.filter(g => g.completed).length > 0 ? `
                <div class="section-header mt-3">
                    <span class="section-title">✅ Metas Completadas</span>
                </div>
                ${goals.filter(g => g.completed).map(goal => this.renderGoalCard(goal)).join('')}
            ` : ''}

            <!-- AI Suggested Goals -->
            <div class="card mt-3" style="border-color: var(--accent);">
                <h3 class="card-title mb-2">🤖 Metas Sugeridas por IA</h3>
                ${this.getAISuggestedGoals(profile).map(sg => `
                    <div class="flex items-center gap-2 mb-2" style="padding: 0.5rem; background: var(--bg-input); border-radius: 8px;">
                        <span style="font-size: 1.2rem;">${sg.icon}</span>
                        <div style="flex: 1;">
                            <p style="font-size: 0.85rem; font-weight: 500;">${sg.title}</p>
                            <p class="text-muted" style="font-size: 0.7rem;">${sg.desc}</p>
                        </div>
                        <button class="btn btn-accent btn-sm" onclick="GoalsPage.addSuggestedGoal('${sg.title}', '${sg.category}', ${sg.target})">+</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderGoalCard(goal) {
        const progress = goal.target && goal.current !== undefined ? 
            Math.min(Math.round(((goal.currentProgress || goal.current) / goal.target) * 100), 100) : 0;
        const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / (1000*60*60*24))) : null;
        const categoryIcons = { fuerza: '💪', peso: '⚖️', habito: '🔄', medida: '📐', nutricion: '🥗', otro: '🎯' };

        return `
            <div class="card mb-2 ${goal.completed ? 'goal-completed' : ''}" style="${goal.completed ? 'opacity: 0.7;' : ''}">
                <div class="flex items-center gap-2 mb-1">
                    <span style="font-size: 1.3rem;">${categoryIcons[goal.category] || '🎯'}</span>
                    <div style="flex: 1;">
                        <p style="font-weight: 600; font-size: 0.9rem; ${goal.completed ? 'text-decoration: line-through;' : ''}">${goal.description}</p>
                        <p class="text-muted" style="font-size: 0.7rem;">
                            ${daysLeft !== null ? `${daysLeft} días restantes` : ''}
                            ${goal.deadline ? ` • Límite: ${this.formatDate(goal.deadline)}` : ''}
                        </p>
                    </div>
                    ${!goal.completed ? `
                        <button class="btn btn-success btn-sm" onclick="GoalsPage.completeGoal('${goal.id}')" title="Completar">✓</button>
                    ` : ''}
                </div>
                ${goal.target ? `
                    <div class="progress-bar mt-1" style="height: 8px;">
                        <div class="progress-fill ${progress >= 100 ? 'success' : 'primary'}" style="width: ${progress}%"></div>
                    </div>
                    <div class="flex justify-between mt-1">
                        <span class="text-muted" style="font-size: 0.7rem;">${goal.currentProgress || goal.current || 0} / ${goal.target}</span>
                        <span class="text-muted" style="font-size: 0.7rem;">${progress}%</span>
                    </div>
                    ${!goal.completed ? `
                        <div class="flex gap-1 mt-1">
                            <input type="number" class="form-input" id="goal-update-${goal.id}" placeholder="Nuevo valor" style="flex:1; padding: 0.4rem; font-size: 0.8rem;" step="0.5">
                            <button class="btn btn-primary btn-sm" onclick="GoalsPage.updateGoalProgress('${goal.id}')">Actualizar</button>
                        </div>
                    ` : ''}
                ` : ''}
            </div>
        `;
    },

    renderMilestones() {
        const milestones = this.getMilestones();

        return `
            <div class="section-header mb-2">
                <span class="section-title">🏆 Logros Desbloqueados</span>
            </div>

            <div class="milestones-grid">
                ${milestones.map(m => `
                    <div class="milestone-card ${m.unlocked ? 'unlocked' : 'locked'}">
                        <span class="milestone-icon">${m.unlocked ? m.icon : '🔒'}</span>
                        <span class="milestone-name">${m.name}</span>
                        <span class="milestone-desc">${m.desc}</span>
                        ${m.unlocked ? `<span class="milestone-date">${m.date || ''}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Helpers
    renderDateInfo(dateStr, workouts, goals) {
        const dayWorkouts = workouts.filter(w => w.date && w.date.startsWith(dateStr));
        const dayGoals = goals.filter(g => g.date === dateStr || g.deadline === dateStr);

        if (dayWorkouts.length === 0 && dayGoals.length === 0) {
            return '<p class="text-muted" style="font-size: 0.85rem;">No hay actividad registrada este día.</p>';
        }

        let html = '';
        if (dayWorkouts.length > 0) {
            html += dayWorkouts.map(w => `
                <div class="flex items-center gap-2 mb-1" style="padding: 0.4rem; background: rgba(46,204,113,0.1); border-radius: 6px;">
                    <span>💪</span>
                    <span style="font-size: 0.8rem;">${w.dayName || 'Entrenamiento'} - ${w.totalVolume || 0}kg vol - ${w.duration || 0}min</span>
                </div>
            `).join('');
        }
        if (dayGoals.length > 0) {
            html += dayGoals.map(g => `
                <div class="flex items-center gap-2 mb-1" style="padding: 0.4rem; background: rgba(108,99,255,0.1); border-radius: 6px;">
                    <span>🎯</span>
                    <span style="font-size: 0.8rem;">${g.description}</span>
                </div>
            `).join('');
        }
        return html;
    },

    formatDate(dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    },

    getMonthWorkouts(workouts, month, year) {
        return workouts.filter(w => {
            const d = new Date(w.date);
            return d.getMonth() === month && d.getFullYear() === year;
        }).length;
    },

    getAdherence(workouts, month, year) {
        const profile = Storage.getProfile();
        const target = (profile.daysPerWeek || 4) * 4;
        const actual = this.getMonthWorkouts(workouts, month, year);
        return Math.min(Math.round((actual / target) * 100), 100);
    },

    getStreak(workouts) {
        if (workouts.length === 0) return 0;
        let streak = 0;
        const today = new Date(); today.setHours(0,0,0,0);
        for (let i = 0; i <= 60; i++) {
            const check = new Date(today); check.setDate(today.getDate() - i);
            const has = workouts.some(w => new Date(w.date).toDateString() === check.toDateString());
            if (has) streak++;
            else if (i > 0) break;
        }
        return streak;
    },

    getAISuggestedGoals(profile) {
        const weight = profile.weight || 70;
        const level = profile.level || 'intermedio';
        return [
            { icon: '💪', title: `Bench Press ${Math.round(weight * 1.2)}kg`, desc: '1.2x peso corporal', category: 'fuerza', target: Math.round(weight * 1.2) },
            { icon: '🦵', title: `Sentadilla ${Math.round(weight * 1.5)}kg`, desc: '1.5x peso corporal', category: 'fuerza', target: Math.round(weight * 1.5) },
            { icon: '🔥', title: 'Entrenar 4 semanas seguidas', desc: 'Sin faltar ningún día programado', category: 'habito', target: 28 },
            { icon: '⚖️', title: `Llegar a ${profile.goal && profile.goal.includes('perder') ? Math.round(weight - 5) : Math.round(weight + 3)}kg`, desc: profile.goal || 'Objetivo de peso', category: 'peso', target: profile.goal && profile.goal.includes('perder') ? Math.round(weight - 5) : Math.round(weight + 3) },
            { icon: '🥩', title: `${Math.round(weight * 2)}g proteína/día por 30 días`, desc: 'Nutrición consistente', category: 'nutricion', target: 30 },
        ];
    },

    getMilestones() {
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const total = workouts.length;

        return [
            { icon: '🌱', name: 'Primer Paso', desc: 'Completa tu primer entrenamiento', unlocked: total >= 1 },
            { icon: '🔥', name: 'En Llamas', desc: 'Completa 7 entrenamientos', unlocked: total >= 7 },
            { icon: '💪', name: 'Consistente', desc: 'Completa 15 entrenamientos', unlocked: total >= 15 },
            { icon: '🏋️', name: 'Máquina', desc: 'Completa 30 entrenamientos', unlocked: total >= 30 },
            { icon: '👑', name: 'Imparable', desc: 'Completa 50 entrenamientos', unlocked: total >= 50 },
            { icon: '🏆', name: 'Record', desc: 'Logra tu primer PR', unlocked: Object.keys(prs).length >= 1 },
            { icon: '⚡', name: 'PR Hunter', desc: 'Logra 5 PRs diferentes', unlocked: Object.keys(prs).length >= 5 },
            { icon: '📊', name: 'Analítico', desc: 'Registra 10 mediciones', unlocked: Storage.getMeasurements().length >= 10 },
            { icon: '🥗', name: 'Disciplinado', desc: 'Registra 20 comidas', unlocked: Storage.getNutritionLog().length >= 20 },
            { icon: '🌟', name: 'Transformación', desc: 'Completa el programa de 12 semanas', unlocked: Storage.getCurrentWeek() >= 12 },
        ];
    },

    // Actions
    setTab(tab) { this.activeTab = tab; App.renderCurrentPage(); },
    selectDate(date) { this.selectedDate = date; App.renderCurrentPage(); },
    prevMonth() { this.currentMonth--; if(this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; } App.renderCurrentPage(); },
    nextMonth() { this.currentMonth++; if(this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; } App.renderCurrentPage(); },

    addGoal() {
        const desc = document.getElementById('goal-desc')?.value;
        if (!desc) { Helpers.showToast('Describe tu meta', 'error'); return; }
        const goal = {
            id: Helpers.generateId(),
            description: desc,
            category: document.getElementById('goal-category')?.value || 'otro',
            deadline: document.getElementById('goal-deadline')?.value || null,
            current: parseFloat(document.getElementById('goal-current')?.value) || 0,
            target: parseFloat(document.getElementById('goal-target')?.value) || null,
            currentProgress: parseFloat(document.getElementById('goal-current')?.value) || 0,
            completed: false,
            createdAt: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };
        Storage.addGoal(goal);
        Helpers.showToast('🎯 Meta creada!');
        App.renderCurrentPage();
    },

    addSuggestedGoal(title, category, target) {
        const goal = {
            id: Helpers.generateId(), description: title, category,
            target, current: 0, currentProgress: 0, completed: false,
            createdAt: new Date().toISOString(), date: new Date().toISOString().split('T')[0]
        };
        Storage.addGoal(goal);
        Helpers.showToast('🎯 Meta añadida!');
        App.renderCurrentPage();
    },

    updateGoalProgress(goalId) {
        const val = parseFloat(document.getElementById(`goal-update-${goalId}`)?.value);
        if (isNaN(val)) return;
        Storage.updateGoalProgress(goalId, val);
        Helpers.showToast('📈 Progreso actualizado');
        App.renderCurrentPage();
    },

    completeGoal(goalId) {
        Storage.completeGoal(goalId);
        Helpers.showToast('🎉 ¡Meta completada!');
        App.renderCurrentPage();
    }
};
