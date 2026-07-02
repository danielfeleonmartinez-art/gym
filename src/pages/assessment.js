// ===== ASSESSMENT PAGE - Valoración Personal =====
const AssessmentPage = {
    render() {
        const profile = Storage.getProfile();
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const measurements = Storage.getMeasurements();
        const week = Storage.getCurrentWeek();
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const bmi = (weight / ((height/100)**2)).toFixed(1);

        // Calculate strengths and weaknesses
        const strengths = this.getStrengths(workouts, prs, profile);
        const weaknesses = this.getWeaknesses(workouts, prs, profile);
        const score = this.getOverallScore(workouts, prs, measurements, profile);

        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">📊 Valoración Personal</h2>

            <!-- Overall Score -->
            <div class="card mb-3 text-center" style="border-color: ${score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'};">
                <p style="font-size: 3rem; font-weight: 800; color: ${score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'};">${score}/100</p>
                <p style="font-size: 0.9rem; font-weight: 600;">Puntuación General</p>
                <p class="text-muted" style="font-size: 0.75rem;">${score >= 80 ? '¡Excelente! Vas por muy buen camino' : score >= 50 ? 'Bien, pero hay margen de mejora' : 'Necesitas más consistencia'}</p>
            </div>

            <!-- Body Stats -->
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-value">${weight}kg</div><div class="stat-label">Peso</div></div>
                <div class="stat-card"><div class="stat-value">${bmi}</div><div class="stat-label">IMC</div></div>
                <div class="stat-card"><div class="stat-value">${workouts.length}</div><div class="stat-label">Entrenos</div></div>
                <div class="stat-card"><div class="stat-value">${Object.keys(prs).length}</div><div class="stat-label">PRs</div></div>
            </div>

            <!-- Strengths -->
            <div class="card mb-2" style="border-color: var(--success);">
                <h3 class="card-title" style="color: var(--success);">💪 Tus Fortalezas</h3>
                <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
                    ${strengths.map(s => '<li style="padding: 0.3rem 0; font-size: 0.85rem; color: var(--text-secondary);">✅ ' + s + '</li>').join('')}
                </ul>
            </div>

            <!-- Weaknesses -->
            <div class="card mb-2" style="border-color: var(--warning);">
                <h3 class="card-title" style="color: var(--warning);">⚠️ Áreas de Mejora</h3>
                <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
                    ${weaknesses.map(w => '<li style="padding: 0.3rem 0; font-size: 0.85rem; color: var(--text-secondary);">🔸 ' + w + '</li>').join('')}
                </ul>
            </div>

            <!-- AI Suggestions -->
            <div class="card mb-2" style="border-color: var(--primary);">
                <h3 class="card-title" style="color: var(--primary);">🤖 Sugerencias de la IA</h3>
                <ul style="list-style: none; padding: 0; margin-top: 0.5rem;">
                    ${this.getAISuggestions(profile, workouts, prs).map(s => '<li style="padding: 0.3rem 0; font-size: 0.85rem; color: var(--text-secondary);">💡 ' + s + '</li>').join('')}
                </ul>
            </div>

            <!-- Weight Timeline -->
            <div class="card">
                <h3 class="card-title mb-2">📈 Objetivo de Peso (IA)</h3>
                ${this.renderWeightTimeline(profile)}
            </div>

            <!-- Somatotype -->
            <div class="card mt-3" style="border-color: var(--accent);">
                <h3 class="card-title mb-2">🧬 Tu Somatotipo</h3>
                ${this.renderSomatotype(profile)}
            </div>
        </div>`;
    },

    getOverallScore(workouts, prs, measurements, profile) {
        let score = 0;
        const week = Storage.getCurrentWeek();
        const expected = week * (profile.daysPerWeek || 4);
        
        // Adherence (40 points)
        if (expected > 0) score += Math.min(40, Math.round((workouts.length / expected) * 40));
        // PRs (20 points)
        score += Math.min(20, Object.keys(prs).length * 4);
        // Measurements tracked (10 points)
        score += Math.min(10, measurements.length * 2);
        // Profile complete (10 points)
        if (profile.weight && profile.height && profile.age && profile.goal) score += 10;
        // Consistency last 7 days (20 points)
        const last7 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7*24*60*60*1000));
        score += Math.min(20, last7.length * 5);
        
        return Math.min(100, score);
    },

    getStrengths(workouts, prs, profile) {
        const strengths = [];
        if (workouts.length > 10) strengths.push('Buena consistencia en entrenamientos');
        if (Object.keys(prs).length > 3) strengths.push('Múltiples PRs logrados - estás progresando');
        if (profile.weight && profile.height) strengths.push('Perfil completo - la IA puede personalizar mejor');
        const last7 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7*24*60*60*1000));
        if (last7.length >= (profile.daysPerWeek || 4)) strengths.push('Cumples tu objetivo semanal de entrenamientos');
        if (strengths.length === 0) strengths.push('¡Empezaste! Ese es el primer paso más importante');
        return strengths;
    },

    getWeaknesses(workouts, prs, profile) {
        const weaknesses = [];
        if (workouts.length < 5) weaknesses.push('Pocos entrenamientos registrados - la consistencia es clave');
        if (Object.keys(prs).length === 0) weaknesses.push('Sin PRs registrados - intenta progresar en peso cada semana');
        const last7 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7*24*60*60*1000));
        if (last7.length < (profile.daysPerWeek || 4)) weaknesses.push('No alcanzas tu objetivo semanal de sesiones');
        if (!profile.goal) weaknesses.push('Define un objetivo claro (ganar músculo, perder grasa, etc)');
        if (Storage.getNutritionLog().length < 5) weaknesses.push('Poco tracking nutricional - la dieta es el 70% del resultado');
        if (weaknesses.length === 0) weaknesses.push('¡Vas muy bien! Sigue así y mantén la consistencia');
        return weaknesses;
    },

    getAISuggestions(profile, workouts, prs) {
        const suggestions = [];
        const weight = profile.weight || 70;
        
        if (profile.goal && profile.goal.includes('perder')) {
            suggestions.push(`Come ${Math.round(weight * 25)} kcal/día con ${Math.round(weight * 2.2)}g proteína`);
            suggestions.push('Añade 3-4 sesiones de cardio LISS de 20-30min');
        } else {
            suggestions.push(`Come ${Math.round(weight * 34)} kcal/día con ${Math.round(weight * 2)}g proteína`);
            suggestions.push('Enfócate en progresión de cargas: +2.5kg/semana en compuestos');
        }
        suggestions.push('Duerme 7-9 horas cada noche - es donde creces');
        suggestions.push(`Bebe mínimo ${Math.round(weight * 0.035)}L de agua diarios`);
        suggestions.push('Registra TODO: peso, comidas, entrenamientos. Lo que no se mide no se mejora.');
        return suggestions;
    },

    renderWeightTimeline(profile) {
        const weight = profile.weight || 70;
        const goal = profile.goal || 'ganar músculo';
        const isLosing = goal.includes('perder') || goal.includes('definir');
        const weeklyChange = isLosing ? -0.5 : 0.25;
        const weeks = [0, 2, 4, 6, 8, 10, 12];
        
        return `
            <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <p style="margin-bottom: 0.75rem;">Meta: ${isLosing ? 'Perder grasa' : 'Ganar músculo'} (${weeklyChange > 0 ? '+' : ''}${weeklyChange}kg/semana)</p>
                ${weeks.map(w => {
                    const projected = (weight + (weeklyChange * w)).toFixed(1);
                    const isCurrent = w <= Storage.getCurrentWeek() && w + 2 > Storage.getCurrentWeek();
                    return `<div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0; ${isCurrent ? 'background: rgba(108,99,255,0.1); border-radius: 6px; padding: 0.5rem;' : ''}">
                        <span style="min-width: 60px; font-weight: ${isCurrent ? '700' : '400'};">Semana ${w}</span>
                        <div style="flex: 1; height: 4px; background: var(--border); border-radius: 2px;">
                            <div style="width: ${Math.min(100, (w/12)*100)}%; height: 100%; background: var(--primary); border-radius: 2px;"></div>
                        </div>
                        <span style="min-width: 50px; text-align: right; font-weight: ${isCurrent ? '700' : '400'}; color: ${isCurrent ? 'var(--primary)' : 'var(--text-muted)'};">${projected}kg</span>
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    renderSomatotype(profile) {
        const soma = FitnessTools.getSomatotype(profile);
        const colors = { 'Ectomorfo': '#4ECDC4', 'Mesomorfo': '#6C63FF', 'Endomorfo': '#FF6B6B' };
        const icons = { 'Ectomorfo': '🏃', 'Mesomorfo': '💪', 'Endomorfo': '🐻' };
        
        return `
            <div style="text-align: center; margin-bottom: 1rem;">
                <span style="font-size: 2.5rem;">${icons[soma.type]}</span>
                <p style="font-size: 1.3rem; font-weight: 800; color: ${colors[soma.type]}; margin-top: 0.5rem;">${soma.type}</p>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">${soma.description}</p>
            </div>
            
            <div style="margin-top: 1rem;">
                <p style="font-weight: 600; margin-bottom: 0.5rem;">🏋️ Entrenamiento ideal:</p>
                <ul style="list-style: none; padding: 0;">
                    ${soma.training.map(t => '<li style="padding: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary);">• ' + t + '</li>').join('')}
                </ul>
            </div>
            
            <div style="margin-top: 1rem;">
                <p style="font-weight: 600; margin-bottom: 0.5rem;">🥗 Nutrición ideal:</p>
                <ul style="list-style: none; padding: 0;">
                    ${soma.nutrition.map(n => '<li style="padding: 0.25rem 0; font-size: 0.8rem; color: var(--text-secondary);">• ' + n + '</li>').join('')}
                </ul>
            </div>
        `;
    }
};
