// ===== RANK SYSTEM PAGE - Symmetry/FIFA Inspired =====
const RanksPage = {
    render() {
        const profile = Storage.getProfile();
        const prs = Storage.getPRs();
        const workouts = Storage.getWorkoutHistory();
        const overall = this.calculateOverall(profile, prs, workouts);
        const muscleRanks = this.calculateMuscleRanks(prs, profile);
        const exerciseRanks = this.calculateExerciseRanks(prs, profile);

        return `
        <div class="animate-fade">
            <!-- Overall Rating Card -->
            <div class="overall-card">
                <div class="overall-score-container">
                    <div class="overall-ring" style="--progress: ${overall.score}">
                        <div class="overall-number">${overall.score}</div>
                    </div>
                    <div class="overall-info">
                        <div class="overall-rank">${overall.rank}</div>
                        <div class="overall-label">Overall Rating</div>
                        <div class="overall-sublabel">${profile.name || 'Atleta'} - ${profile.level || 'Intermedio'}</div>
                    </div>
                </div>
                <div class="overall-stats">
                    <div class="os-item">
                        <span class="os-value">${workouts.length}</span>
                        <span class="os-label">Sesiones</span>
                    </div>
                    <div class="os-item">
                        <span class="os-value">${Object.keys(prs).length}</span>
                        <span class="os-label">PRs</span>
                    </div>
                    <div class="os-item">
                        <span class="os-value">${overall.consistency}%</span>
                        <span class="os-label">Consistencia</span>
                    </div>
                    <div class="os-item">
                        <span class="os-value">${overall.strength}</span>
                        <span class="os-label">Fuerza</span>
                    </div>
                </div>
            </div>

            <!-- Muscle Rankings -->
            <div class="section-header mt-3">
                <h3 class="section-title">Ranking por Musculo</h3>
            </div>
            <div class="muscle-ranks-grid">
                ${muscleRanks.map(m => `
                    <div class="muscle-rank-card">
                        <div class="mr-header">
                            <span class="mr-name">${m.name}</span>
                            <span class="mr-score ${m.tier}">${m.score}</span>
                        </div>
                        <div class="mr-bar">
                            <div class="mr-bar-fill" style="width: ${m.score}%; background: ${m.color}"></div>
                        </div>
                        <div class="mr-tier">${m.tierLabel}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Top Exercise Ranks -->
            <div class="section-header mt-3">
                <h3 class="section-title">Ranking por Ejercicio</h3>
                <span class="text-muted" style="font-size:0.7rem">Basado en fuerza relativa</span>
            </div>
            <div class="exercise-ranks-list">
                ${exerciseRanks.map((ex, i) => `
                    <div class="exercise-rank-item">
                        <div class="er-position">${i + 1}</div>
                        <div class="er-info">
                            <div class="er-name">${ex.name}</div>
                            <div class="er-detail">${ex.weight}kg | ${ex.ratio}x BW</div>
                        </div>
                        <div class="er-rank ${ex.tier}">${ex.tierLabel}</div>
                    </div>
                `).join('')}
                ${exerciseRanks.length === 0 ? '<div class="text-muted" style="text-align:center;padding:1.5rem;font-size:0.8rem">Completa entrenamientos para desbloquear rankings</div>' : ''}
            </div>

            <!-- Rank Legend -->
            <div class="rank-legend mt-3">
                <div class="rl-item"><span class="rl-badge elite">99</span> Elite</div>
                <div class="rl-item"><span class="rl-badge advanced">80</span> Avanzado</div>
                <div class="rl-item"><span class="rl-badge intermediate">60</span> Intermedio</div>
                <div class="rl-item"><span class="rl-badge beginner">40</span> Principiante</div>
                <div class="rl-item"><span class="rl-badge novice">20</span> Novato</div>
            </div>
        </div>`;
    },

    calculateOverall(profile, prs, workouts) {
        const w = profile.weight || 70;
        const week = Storage.getCurrentWeek();
        const expectedWorkouts = week * (profile.daysPerWeek || 4);
        const consistency = expectedWorkouts > 0 ? Math.min(100, Math.round(workouts.length / expectedWorkouts * 100)) : 0;

        // Strength score based on big 3
        const bench = prs['bench-press'] ? prs['bench-press'].weight / w : 0;
        const squat = prs['squat'] ? prs['squat'].weight / w : 0;
        const dead = prs['deadlift'] ? prs['deadlift'].weight / w : 0;
        const strengthRaw = (bench + squat + dead) / 3;

        let strengthScore;
        if (strengthRaw > 2.0) strengthScore = 95;
        else if (strengthRaw > 1.5) strengthScore = 85;
        else if (strengthRaw > 1.2) strengthScore = 75;
        else if (strengthRaw > 0.9) strengthScore = 65;
        else if (strengthRaw > 0.6) strengthScore = 50;
        else if (strengthRaw > 0.3) strengthScore = 35;
        else strengthScore = 20;

        // Volume score
        const prCount = Object.keys(prs).length;
        const volumeScore = Math.min(95, 20 + prCount * 3);

        // Experience score
        const expScore = Math.min(95, 20 + workouts.length * 2);

        // Overall = weighted average
        const score = Math.round(strengthScore * 0.4 + consistency * 0.25 + volumeScore * 0.2 + expScore * 0.15);

        let rank, strength;
        if (score >= 90) { rank = 'ELITE'; strength = 'S'; }
        else if (score >= 75) { rank = 'AVANZADO'; strength = 'A'; }
        else if (score >= 60) { rank = 'INTERMEDIO'; strength = 'B'; }
        else if (score >= 40) { rank = 'PRINCIPIANTE'; strength = 'C'; }
        else { rank = 'NOVATO'; strength = 'D'; }

        return { score, rank, consistency, strength, strengthScore };
    },

    calculateMuscleRanks(prs, profile) {
        const w = profile.weight || 70;
        const muscleGroups = [
            { name: 'Pecho', exercises: ['bench-press', 'incline-bench', 'dumbbell-fly'], color: '#EF4444' },
            { name: 'Espalda', exercises: ['pull-ups', 'barbell-row', 'lat-pulldown', 'deadlift'], color: '#3B82F6' },
            { name: 'Hombros', exercises: ['ohp', 'lateral-raise'], color: '#F59E0B' },
            { name: 'Piernas', exercises: ['squat', 'leg-press', 'romanian-deadlift', 'bulgarian-split'], color: '#8B5CF6' },
            { name: 'Biceps', exercises: ['barbell-curl', 'incline-curl', 'hammer-curl'], color: '#EC4899' },
            { name: 'Triceps', exercises: ['close-grip-bench', 'overhead-extension', 'tricep-pushdown'], color: '#06B6D4' },
            { name: 'Core', exercises: ['hanging-leg-raise', 'cable-crunch', 'plank'], color: '#10B981' },
        ];

        return muscleGroups.map(group => {
            const groupPRs = group.exercises.map(id => prs[id] ? prs[id].weight / w : 0).filter(v => v > 0);
            let score;
            if (groupPRs.length === 0) {
                score = 15;
            } else {
                const avg = groupPRs.reduce((a, b) => a + b, 0) / groupPRs.length;
                if (avg > 1.8) score = 95;
                else if (avg > 1.4) score = 85;
                else if (avg > 1.0) score = 72;
                else if (avg > 0.7) score = 58;
                else if (avg > 0.4) score = 42;
                else score = 28;
            }

            let tier, tierLabel;
            if (score >= 85) { tier = 'elite'; tierLabel = 'Elite'; }
            else if (score >= 70) { tier = 'advanced'; tierLabel = 'Avanzado'; }
            else if (score >= 55) { tier = 'intermediate'; tierLabel = 'Intermedio'; }
            else if (score >= 35) { tier = 'beginner'; tierLabel = 'Principiante'; }
            else { tier = 'novice'; tierLabel = 'Novato'; }

            return { ...group, score, tier, tierLabel };
        }).sort((a, b) => b.score - a.score);
    },

    calculateExerciseRanks(prs, profile) {
        const w = profile.weight || 70;
        return Object.entries(prs).map(([id, data]) => {
            const ex = EXERCISES_DB.find(e => e.id === id);
            if (!ex) return null;
            const ratio = (data.weight / w).toFixed(2);

            let tier, tierLabel;
            if (ratio > 2.0) { tier = 'elite'; tierLabel = 'Elite'; }
            else if (ratio > 1.5) { tier = 'advanced'; tierLabel = 'Avanzado'; }
            else if (ratio > 1.0) { tier = 'intermediate'; tierLabel = 'Intermedio'; }
            else if (ratio > 0.6) { tier = 'beginner'; tierLabel = 'Principiante'; }
            else { tier = 'novice'; tierLabel = 'Novato'; }

            return { name: ex.name, weight: data.weight, ratio, tier, tierLabel };
        }).filter(Boolean).sort((a, b) => parseFloat(b.ratio) - parseFloat(a.ratio));
    }
};
