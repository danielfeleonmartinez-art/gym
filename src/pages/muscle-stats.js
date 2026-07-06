// ===== MUSCLE STATS - Tarjeta de Stats tipo Videojuego =====
const MuscleStatsPage = {
    render() {
        const profile = Storage.getProfile();
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const stats = this.calculateAllStats(workouts, prs, profile);
        const overallRating = this.getOverallRating(stats);
        const bodyType = this.getRecommendedFocus(stats);

        return `
        <div class="animate-fade">
            <h2 style="font-size: 1.3rem; font-weight: 700; margin-bottom: 1rem;">🎮 Tus Stats Musculares</h2>

            <!-- Player Card -->
            <div class="card mb-3" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border: 2px solid var(--primary); position: relative; overflow: hidden;">
                <div style="position: absolute; top: -20px; right: -20px; font-size: 6rem; opacity: 0.1;"></div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 2rem; border: 3px solid var(--primary);">
                        ${profile.name ? profile.name[0].toUpperCase() : ''}
                    </div>
                    <div>
                        <p style="font-size: 1.2rem; font-weight: 800;">${profile.name || 'Atleta'}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted);">${profile.level || 'Intermedio'} • ${profile.goal || 'Fitness'}</p>
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.3rem;">
                            <span class="badge badge-primary">${this.getRank(overallRating)}</span>
                        </div>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 1rem;">
                    <p style="font-size: 3.5rem; font-weight: 900; background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${overallRating}</p>
                    <p style="font-size: 0.75rem; color: var(--text-muted);">RATING GENERAL</p>
                </div>
            </div>

            <!-- Muscle Ratings Grid -->
            <div class="section-header mb-2">
                <span class="section-title"> Stats por Músculo</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
                ${Object.entries(stats).map(([muscle, data]) => `
                    <div class="card" style="padding: 0.75rem; border-color: ${this.getRatingColor(data.rating)}40;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 0.75rem; font-weight: 600;">${muscle}</span>
                            <span style="font-size: 1.1rem; font-weight: 800; color: ${this.getRatingColor(data.rating)};">${data.rating}</span>
                        </div>
                        <div class="progress-bar mt-1" style="height: 4px;">
                            <div style="width: ${data.rating}%; height: 100%; background: ${this.getRatingColor(data.rating)}; border-radius: 2px;"></div>
                        </div>
                        <p style="font-size: 0.6rem; color: var(--text-muted); margin-top: 0.3rem;">${data.level}</p>
                    </div>
                `).join('')}
            </div>

            <!-- AI Analysis -->
            <div class="card mb-3" style="border-color: var(--accent);">
                <h3 class="card-title mb-2">🤖 Análisis IA de tu Físico</h3>
                <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.7;">
                    ${this.getAIAnalysis(stats, profile)}
                </div>
            </div>

            <!-- Progressive Overload Calculator -->
            <div class="card mb-3">
                <h3 class="card-title mb-2"> Sobrecarga Progresiva (IA)</h3>
                <p class="text-muted mb-2" style="font-size: 0.75rem;">Basado en tus PRs y historial, estos son tus objetivos para la PRÓXIMA sesión:</p>
                ${this.renderProgressiveOverload(prs, profile)}
            </div>

            <!-- Recommended Focus -->
            <div class="card mb-3" style="border-color: var(--warning);">
                <h3 class="card-title mb-1" style="color: var(--warning);"> Enfoque Recomendado</h3>
                <p style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${bodyType.title}</p>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">${bodyType.description}</p>
                <div style="margin-top: 0.75rem;">
                    <p style="font-size: 0.75rem; font-weight: 600; margin-bottom: 0.3rem;">Priorizar:</p>
                    ${bodyType.priorities.map(p => `<span class="badge badge-warning" style="margin: 0.15rem;">${p}</span>`).join('')}
                </div>
            </div>

            <!-- Training Plan Generated by AI -->
            <div class="card">
                <h3 class="card-title mb-2"> Plan Generado por IA</h3>
                <p class="text-muted mb-2" style="font-size: 0.75rem;">Basado en tus debilidades y objetivos:</p>
                <button class="btn btn-primary btn-full" onclick="MuscleStatsPage.generateAIPlan()">
                    🤖 Generar Plan Óptimo
                </button>
                <button class="btn btn-accent btn-full mt-1" onclick="MuscleStatsPage.generateAestheticPlan()">
                    ✨ Plan Estético (V-Taper)
                </button>
                <button class="btn btn-secondary btn-full mt-1" onclick="MuscleStatsPage.generateStrengthPlan()">
                     Plan de Fuerza (PRs)
                </button>
            </div>
        </div>`;
    },

    calculateAllStats(workouts, prs, profile) {
        const muscles = {
            'Pecho': { exercises: ['bench-press', 'incline-db-press', 'dip-chest', 'pec-deck'] },
            'Espalda': { exercises: ['pull-ups', 'barbell-row', 'lat-pulldown', 'deadlift'] },
            'Hombros': { exercises: ['ohp', 'lateral-raise', 'db-shoulder-press', 'face-pulls'] },
            'Bíceps': { exercises: ['barbell-curl', 'incline-curl', 'hammer-curl', 'preacher-curl'] },
            'Tríceps': { exercises: ['tricep-pushdown', 'skull-crusher', 'overhead-cable-ext', 'close-grip-bench'] },
            'Cuádriceps': { exercises: ['squat', 'leg-press', 'leg-extension', 'hack-squat'] },
            'Isquiotibiales': { exercises: ['romanian-deadlift', 'lying-leg-curl', 'nordic-curl'] },
            'Glúteos': { exercises: ['hip-thrust', 'bulgarian-split', 'glute-bridge'] },
            'Core': { exercises: ['hanging-leg-raise', 'cable-crunch', 'ab-wheel', 'plank'] },
            'Pantorrillas': { exercises: ['standing-calf-raise', 'seated-calf-raise'] },
        };

        const stats = {};
        const weight = profile.weight || 70;

        Object.entries(muscles).forEach(([muscle, data]) => {
            let rating = 10; // Base rating
            let maxPR = 0;

            // Add points for PRs in this muscle's exercises
            data.exercises.forEach(exId => {
                if (prs[exId]) {
                    const prWeight = prs[exId].weight;
                    maxPR = Math.max(maxPR, prWeight);
                    // Rating based on strength relative to body weight
                    const ratio = prWeight / weight;
                    rating += Math.min(20, Math.round(ratio * 15));
                }
            });

            // Add points for workout frequency (how often this muscle is trained)
            const muscleWorkouts = workouts.filter(w => {
                if (!w.dayName) return false;
                const dayLower = w.dayName.toLowerCase();
                return dayLower.includes(muscle.toLowerCase()) || 
                       (muscle === 'Pecho' && dayLower.includes('push')) ||
                       (muscle === 'Espalda' && dayLower.includes('pull')) ||
                       (muscle === 'Cuádriceps' && dayLower.includes('leg')) ||
                       (muscle === 'Isquiotibiales' && dayLower.includes('leg'));
            });
            rating += Math.min(25, muscleWorkouts.length * 2);

            // Add points for total workouts (general fitness)
            rating += Math.min(15, Math.round(workouts.length * 0.5));

            // Cap at 99
            rating = Math.min(99, Math.max(5, rating));

            let level;
            if (rating >= 85) level = 'Élite';
            else if (rating >= 70) level = 'Avanzado';
            else if (rating >= 50) level = 'Intermedio';
            else if (rating >= 30) level = 'Principiante';
            else level = 'Novato';

            stats[muscle] = { rating, level, maxPR, workouts: muscleWorkouts.length };
        });

        return stats;
    },

    getOverallRating(stats) {
        const values = Object.values(stats).map(s => s.rating);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    },

    getRank(rating) {
        if (rating >= 85) return ' Élite';
        if (rating >= 70) return '⭐ Avanzado';
        if (rating >= 55) return ' Intermedio';
        if (rating >= 35) return '🌱 Principiante';
        return '🆕 Novato';
    },

    getRatingColor(rating) {
        if (rating >= 80) return '#2ECC71';
        if (rating >= 60) return '#6C63FF';
        if (rating >= 40) return '#F39C12';
        if (rating >= 20) return '#E67E22';
        return '#E74C3C';
    },

    getAIAnalysis(stats, profile) {
        const sorted = Object.entries(stats).sort((a, b) => b[1].rating - a[1].rating);
        const strongest = sorted.slice(0, 3);
        const weakest = sorted.slice(-3).reverse();
        const goal = profile.goal || 'mejorar físico';

        let analysis = `<p><strong> Tus músculos más fuertes:</strong></p><ul style="margin: 0.3rem 0; padding-left: 1rem;">`;
        strongest.forEach(([m, d]) => { analysis += `<li>${m}: ${d.rating}/99 (${d.level})</li>`; });
        analysis += `</ul><br><p><strong>⚠️ Músculos que necesitan trabajo:</strong></p><ul style="margin: 0.3rem 0; padding-left: 1rem;">`;
        weakest.forEach(([m, d]) => { analysis += `<li>${m}: ${d.rating}/99 (${d.level}) → Añade +2-3 series/semana</li>`; });
        analysis += `</ul><br>`;

        if (goal.includes('estetic') || goal.includes('fisico')) {
            analysis += `<p><strong>✨ Para estética:</strong> Prioriza ${weakest[0][0]} y ${weakest[1][0]}. Un físico estético necesita PROPORCIÓN, no solo músculos grandes.</p>`;
        } else if (goal.includes('fuerza')) {
            analysis += `<p><strong> Para fuerza:</strong> Enfócate en progresar en los compuestos pesados (squat, bench, deadlift). Tu punto más débil limita tu fuerza general.</p>`;
        } else {
            analysis += `<p><strong>💡 Recomendación:</strong> Trabaja los músculos débiles con +2-3 series extra por semana. En 6-8 semanas verás equilibrio.</p>`;
        }

        return analysis;
    },

    renderProgressiveOverload(prs, profile) {
        const weight = profile.weight || 70;
        const mainLifts = [
            { id: 'bench-press', name: 'Press Banca', icon: '', target: weight * 1.25 },
            { id: 'squat', name: 'Sentadilla', icon: '', target: weight * 1.5 },
            { id: 'deadlift', name: 'Peso Muerto', icon: '💀', target: weight * 1.75 },
            { id: 'ohp', name: 'Press Militar', icon: '🙆', target: weight * 0.75 },
            { id: 'barbell-row', name: 'Remo', icon: '', target: weight * 1.0 },
        ];

        return mainLifts.map(lift => {
            const pr = prs[lift.id];
            const currentMax = pr ? pr.weight : 0;
            const nextSession = currentMax > 0 ? currentMax + 2.5 : Math.round(weight * 0.5);
            const progress = currentMax > 0 ? Math.min(100, Math.round((currentMax / lift.target) * 100)) : 0;

            return `
                <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                    <span style="font-size: 1.1rem;">${lift.icon}</span>
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="font-size: 0.8rem; font-weight: 600;">${lift.name}</span>
                            <span style="font-size: 0.75rem; color: var(--primary);">${currentMax > 0 ? currentMax + 'kg' : 'Sin PR'} → <strong>${nextSession}kg</strong></span>
                        </div>
                        <div class="progress-bar mt-1" style="height: 3px;">
                            <div style="width: ${progress}%; height: 100%; background: var(--primary); border-radius: 2px;"></div>
                        </div>
                        <span style="font-size: 0.6rem; color: var(--text-muted);">Meta: ${Math.round(lift.target)}kg (${(lift.target/weight).toFixed(1)}x peso corporal)</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    getRecommendedFocus(stats) {
        const sorted = Object.entries(stats).sort((a, b) => a[1].rating - b[1].rating);
        const weakest = sorted.slice(0, 3).map(([m]) => m);

        // Check for aesthetic imbalances
        const shoulders = stats['Hombros']?.rating || 0;
        const waist = stats['Core']?.rating || 0;
        const back = stats['Espalda']?.rating || 0;

        if (shoulders < 50 || back < 50) {
            return {
                title: '✨ Plan Estético: V-Taper',
                description: 'Tu relación hombros/cintura necesita trabajo. Prioriza deltoides laterales y espalda ancha para un físico proporcional y estético.',
                priorities: ['Laterales 4x/sem', 'Pull-ups/Jalones', 'Face Pulls', 'Déficit para cintura']
            };
        }

        if (stats['Cuádriceps']?.rating < 40 || stats['Isquiotibiales']?.rating < 40) {
            return {
                title: ' Plan: Desarrollo de Piernas',
                description: 'Tus piernas están rezagadas respecto al torso. Un físico completo necesita piernas proporcionadas.',
                priorities: ['Sentadilla 2x/sem', 'RDL', 'Leg Press', 'Búlgara']
            };
        }

        return {
            title: ' Plan Balanceado: Volumen General',
            description: `Tus puntos débiles son ${weakest.join(', ')}. Añade volumen extra ahí manteniendo el resto.`,
            priorities: weakest.map(m => m + ' +3 series/sem')
        };
    },

    // Generate and save plans
    generateAIPlan() {
        const profile = Storage.getProfile();
        const stats = this.calculateAllStats(Storage.getWorkoutHistory(), Storage.getPRs(), profile);
        const sorted = Object.entries(stats).sort((a, b) => a[1].rating - b[1].rating);
        const weakMuscles = sorted.slice(0, 3).map(([m]) => m);

        // Generate routine focusing on weak points
        const routine = AIEngine.generateCustomRoutine(profile);
        routine.name = '🤖 Plan IA - Balanceado';
        routine.description = `Enfoque en: ${weakMuscles.join(', ')} (tus puntos débiles)`;
        Storage.saveRoutine(routine);
        Helpers.showToast('✅ Plan IA generado y guardado en Rutinas!');
        App.navigate('routines');
    },

    generateAestheticPlan() {
        const profile = Storage.getProfile();
        const routine = AIEngine.generateCustomRoutine({...profile, goal: 'estetica v-taper'});
        routine.name = '✨ Plan Estético V-Taper';
        routine.description = 'Hombros anchos + espalda ancha + cintura estrecha';
        Storage.saveRoutine(routine);
        Helpers.showToast('✅ Plan Estético guardado!');
        App.navigate('routines');
    },

    generateStrengthPlan() {
        const profile = Storage.getProfile();
        const routine = AIEngine.generateCustomRoutine({...profile, goal: 'fuerza'});
        routine.name = ' Plan de Fuerza (PRs)';
        routine.description = 'Enfocado en progresar en los 5 movimientos principales';
        Storage.saveRoutine(routine);
        Helpers.showToast('✅ Plan de Fuerza guardado!');
        App.navigate('routines');
    }
};
