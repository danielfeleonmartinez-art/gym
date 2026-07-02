// ===== BODY MAP - Muñeco Interactivo de Músculos =====
const BodyMap = {
    selectedMuscles: [],
    view: 'front', // front or back

    render(options = {}) {
        const { selectable = true, showLabels = true, highlightMuscles = [], onSelect = null } = options;
        this.onSelectCallback = onSelect;

        return `
        <div class="body-map-container">
            <div class="body-map-header">
                <button class="tab ${this.view === 'front' ? 'active' : ''}" onclick="BodyMap.setView('front')">Frontal</button>
                <button class="tab ${this.view === 'back' ? 'active' : ''}" onclick="BodyMap.setView('back')">Posterior</button>
            </div>
            <div class="body-map-svg">
                ${this.view === 'front' ? this.renderFront(selectable, highlightMuscles) : this.renderBack(selectable, highlightMuscles)}
            </div>
            ${this.selectedMuscles.length > 0 ? `
                <div class="body-map-selected">
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">Músculos seleccionados:</p>
                    <div class="flex flex-wrap gap-1">
                        ${this.selectedMuscles.map(m => `
                            <span class="badge badge-primary" style="cursor: pointer;" onclick="BodyMap.deselectMuscle('${m}')">
                                ${m} ✕
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>`;
    },

    renderFront(selectable, highlights) {
        const isSelected = (muscle) => this.selectedMuscles.includes(muscle) || highlights.includes(muscle);
        const getColor = (muscle) => isSelected(muscle) ? '#6C63FF' : '#2A2A4A';
        const getOpacity = (muscle) => isSelected(muscle) ? '0.85' : '0.6';
        const click = selectable ? (muscle) => `onclick="BodyMap.toggleMuscle('${muscle}')"` : () => '';

        return `
        <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 280px; margin: 0 auto; display: block;">
            <!-- Head -->
            <ellipse cx="100" cy="30" rx="18" ry="22" fill="#3a3a5a" stroke="#4a4a6a" stroke-width="1"/>
            <!-- Neck -->
            <rect x="92" y="50" width="16" height="14" rx="4" fill="#3a3a5a"/>

            <!-- Trapezius -->
            <path d="M 80 55 Q 70 60 65 72 L 75 70 Q 85 62 92 58 Z" fill="${getColor('Trapecios')}" opacity="${getOpacity('Trapecios')}" ${click('Trapecios')} style="cursor:pointer;"/>
            <path d="M 120 55 Q 130 60 135 72 L 125 70 Q 115 62 108 58 Z" fill="${getColor('Trapecios')}" opacity="${getOpacity('Trapecios')}" ${click('Trapecios')} style="cursor:pointer;"/>

            <!-- Shoulders / Deltoids -->
            <ellipse cx="62" cy="80" rx="14" ry="12" fill="${getColor('Hombros')}" opacity="${getOpacity('Hombros')}" ${click('Hombros')} style="cursor:pointer;"/>
            <ellipse cx="138" cy="80" rx="14" ry="12" fill="${getColor('Hombros')}" opacity="${getOpacity('Hombros')}" ${click('Hombros')} style="cursor:pointer;"/>

            <!-- Chest / Pectorals -->
            <ellipse cx="82" cy="98" rx="17" ry="14" fill="${getColor('Pecho')}" opacity="${getOpacity('Pecho')}" ${click('Pecho')} style="cursor:pointer;"/>
            <ellipse cx="118" cy="98" rx="17" ry="14" fill="${getColor('Pecho')}" opacity="${getOpacity('Pecho')}" ${click('Pecho')} style="cursor:pointer;"/>

            <!-- Biceps -->
            <ellipse cx="52" cy="115" rx="8" ry="18" fill="${getColor('Bíceps')}" opacity="${getOpacity('Bíceps')}" ${click('Bíceps')} style="cursor:pointer;"/>
            <ellipse cx="148" cy="115" rx="8" ry="18" fill="${getColor('Bíceps')}" opacity="${getOpacity('Bíceps')}" ${click('Bíceps')} style="cursor:pointer;"/>

            <!-- Forearms -->
            <ellipse cx="47" cy="148" rx="6" ry="18" fill="${getColor('Antebrazos')}" opacity="${getOpacity('Antebrazos')}" ${click('Antebrazos')} style="cursor:pointer;"/>
            <ellipse cx="153" cy="148" rx="6" ry="18" fill="${getColor('Antebrazos')}" opacity="${getOpacity('Antebrazos')}" ${click('Antebrazos')} style="cursor:pointer;"/>

            <!-- Abs / Core -->
            <rect x="85" y="115" width="30" height="45" rx="6" fill="${getColor('Core')}" opacity="${getOpacity('Core')}" ${click('Core')} style="cursor:pointer;"/>
            <!-- Ab lines -->
            <line x1="100" y1="118" x2="100" y2="155" stroke="#1a1a2e" stroke-width="1" opacity="0.5" pointer-events="none"/>
            <line x1="87" y1="125" x2="113" y2="125" stroke="#1a1a2e" stroke-width="0.5" opacity="0.5" pointer-events="none"/>
            <line x1="87" y1="135" x2="113" y2="135" stroke="#1a1a2e" stroke-width="0.5" opacity="0.5" pointer-events="none"/>
            <line x1="87" y1="145" x2="113" y2="145" stroke="#1a1a2e" stroke-width="0.5" opacity="0.5" pointer-events="none"/>

            <!-- Obliques -->
            <path d="M 75 120 Q 72 135 75 155 L 85 155 L 85 118 Z" fill="${getColor('Oblicuos')}" opacity="${getOpacity('Oblicuos')}" ${click('Oblicuos')} style="cursor:pointer;"/>
            <path d="M 125 120 Q 128 135 125 155 L 115 155 L 115 118 Z" fill="${getColor('Oblicuos')}" opacity="${getOpacity('Oblicuos')}" ${click('Oblicuos')} style="cursor:pointer;"/>

            <!-- Hip Flexors -->
            <ellipse cx="88" cy="170" rx="8" ry="6" fill="${getColor('Hip Flexors')}" opacity="${getOpacity('Hip Flexors')}" ${click('Hip Flexors')} style="cursor:pointer;"/>
            <ellipse cx="112" cy="170" rx="8" ry="6" fill="${getColor('Hip Flexors')}" opacity="${getOpacity('Hip Flexors')}" ${click('Hip Flexors')} style="cursor:pointer;"/>

            <!-- Quads -->
            <ellipse cx="85" cy="220" rx="14" ry="40" fill="${getColor('Cuádriceps')}" opacity="${getOpacity('Cuádriceps')}" ${click('Cuádriceps')} style="cursor:pointer;"/>
            <ellipse cx="115" cy="220" rx="14" ry="40" fill="${getColor('Cuádriceps')}" opacity="${getOpacity('Cuádriceps')}" ${click('Cuádriceps')} style="cursor:pointer;"/>

            <!-- Adductors -->
            <ellipse cx="95" cy="215" rx="5" ry="25" fill="${getColor('Aductores')}" opacity="${getOpacity('Aductores')}" ${click('Aductores')} style="cursor:pointer;"/>
            <ellipse cx="105" cy="215" rx="5" ry="25" fill="${getColor('Aductores')}" opacity="${getOpacity('Aductores')}" ${click('Aductores')} style="cursor:pointer;"/>

            <!-- Tibialis / Shins -->
            <ellipse cx="83" cy="310" rx="7" ry="30" fill="${getColor('Tibial')}" opacity="${getOpacity('Tibial')}" ${click('Tibial')} style="cursor:pointer;"/>
            <ellipse cx="117" cy="310" rx="7" ry="30" fill="${getColor('Tibial')}" opacity="${getOpacity('Tibial')}" ${click('Tibial')} style="cursor:pointer;"/>

            <!-- Calves (front view) -->
            <ellipse cx="90" cy="320" rx="6" ry="25" fill="${getColor('Pantorrillas')}" opacity="${getOpacity('Pantorrillas')}" ${click('Pantorrillas')} style="cursor:pointer;"/>
            <ellipse cx="110" cy="320" rx="6" ry="25" fill="${getColor('Pantorrillas')}" opacity="${getOpacity('Pantorrillas')}" ${click('Pantorrillas')} style="cursor:pointer;"/>

            <!-- Feet -->
            <ellipse cx="85" cy="365" rx="10" ry="5" fill="#3a3a5a"/>
            <ellipse cx="115" cy="365" rx="10" ry="5" fill="#3a3a5a"/>

            <!-- Labels -->
            ${this.view === 'front' ? `
                <text x="100" y="98" text-anchor="middle" font-size="6" fill="#888" pointer-events="none">PECHO</text>
                <text x="100" y="138" text-anchor="middle" font-size="6" fill="#888" pointer-events="none">CORE</text>
                <text x="52" y="120" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">BÍC</text>
                <text x="148" y="120" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">BÍC</text>
                <text x="62" y="80" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">HOMB</text>
                <text x="138" y="80" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">HOMB</text>
                <text x="85" y="225" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">QUAD</text>
                <text x="115" y="225" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">QUAD</text>
            ` : ''}
        </svg>`;
    },

    renderBack(selectable, highlights) {
        const isSelected = (muscle) => this.selectedMuscles.includes(muscle) || highlights.includes(muscle);
        const getColor = (muscle) => isSelected(muscle) ? '#6C63FF' : '#2A2A4A';
        const getOpacity = (muscle) => isSelected(muscle) ? '0.85' : '0.6';
        const click = selectable ? (muscle) => `onclick="BodyMap.toggleMuscle('${muscle}')"` : () => '';

        return `
        <svg viewBox="0 0 200 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 280px; margin: 0 auto; display: block;">
            <!-- Head -->
            <ellipse cx="100" cy="30" rx="18" ry="22" fill="#3a3a5a" stroke="#4a4a6a" stroke-width="1"/>
            <!-- Neck -->
            <rect x="92" y="50" width="16" height="14" rx="4" fill="#3a3a5a"/>

            <!-- Traps -->
            <path d="M 78 55 Q 65 62 60 75 L 72 72 Q 80 63 90 58 Z" fill="${getColor('Trapecios')}" opacity="${getOpacity('Trapecios')}" ${click('Trapecios')} style="cursor:pointer;"/>
            <path d="M 122 55 Q 135 62 140 75 L 128 72 Q 120 63 110 58 Z" fill="${getColor('Trapecios')}" opacity="${getOpacity('Trapecios')}" ${click('Trapecios')} style="cursor:pointer;"/>
            <!-- Mid traps -->
            <rect x="80" y="72" width="40" height="18" rx="5" fill="${getColor('Trapecios')}" opacity="${getOpacity('Trapecios')}" ${click('Trapecios')} style="cursor:pointer;"/>

            <!-- Rear Delts -->
            <ellipse cx="62" cy="80" rx="12" ry="10" fill="${getColor('Deltoides Posterior')}" opacity="${getOpacity('Deltoides Posterior')}" ${click('Deltoides Posterior')} style="cursor:pointer;"/>
            <ellipse cx="138" cy="80" rx="12" ry="10" fill="${getColor('Deltoides Posterior')}" opacity="${getOpacity('Deltoides Posterior')}" ${click('Deltoides Posterior')} style="cursor:pointer;"/>

            <!-- Lats -->
            <path d="M 72 90 Q 68 110 70 140 L 85 140 L 85 92 Z" fill="${getColor('Dorsales')}" opacity="${getOpacity('Dorsales')}" ${click('Dorsales')} style="cursor:pointer;"/>
            <path d="M 128 90 Q 132 110 130 140 L 115 140 L 115 92 Z" fill="${getColor('Dorsales')}" opacity="${getOpacity('Dorsales')}" ${click('Dorsales')} style="cursor:pointer;"/>

            <!-- Rhomboids / Mid Back -->
            <rect x="85" y="90" width="30" height="30" rx="5" fill="${getColor('Espalda Media')}" opacity="${getOpacity('Espalda Media')}" ${click('Espalda Media')} style="cursor:pointer;"/>

            <!-- Triceps -->
            <ellipse cx="52" cy="112" rx="8" ry="18" fill="${getColor('Tríceps')}" opacity="${getOpacity('Tríceps')}" ${click('Tríceps')} style="cursor:pointer;"/>
            <ellipse cx="148" cy="112" rx="8" ry="18" fill="${getColor('Tríceps')}" opacity="${getOpacity('Tríceps')}" ${click('Tríceps')} style="cursor:pointer;"/>

            <!-- Forearms (back) -->
            <ellipse cx="47" cy="148" rx="6" ry="18" fill="${getColor('Antebrazos')}" opacity="${getOpacity('Antebrazos')}" ${click('Antebrazos')} style="cursor:pointer;"/>
            <ellipse cx="153" cy="148" rx="6" ry="18" fill="${getColor('Antebrazos')}" opacity="${getOpacity('Antebrazos')}" ${click('Antebrazos')} style="cursor:pointer;"/>

            <!-- Lower Back / Erectors -->
            <rect x="88" y="125" width="24" height="35" rx="5" fill="${getColor('Lumbares')}" opacity="${getOpacity('Lumbares')}" ${click('Lumbares')} style="cursor:pointer;"/>

            <!-- Glutes -->
            <ellipse cx="85" cy="175" rx="15" ry="14" fill="${getColor('Glúteos')}" opacity="${getOpacity('Glúteos')}" ${click('Glúteos')} style="cursor:pointer;"/>
            <ellipse cx="115" cy="175" rx="15" ry="14" fill="${getColor('Glúteos')}" opacity="${getOpacity('Glúteos')}" ${click('Glúteos')} style="cursor:pointer;"/>

            <!-- Hamstrings -->
            <ellipse cx="85" cy="230" rx="12" ry="35" fill="${getColor('Isquiotibiales')}" opacity="${getOpacity('Isquiotibiales')}" ${click('Isquiotibiales')} style="cursor:pointer;"/>
            <ellipse cx="115" cy="230" rx="12" ry="35" fill="${getColor('Isquiotibiales')}" opacity="${getOpacity('Isquiotibiales')}" ${click('Isquiotibiales')} style="cursor:pointer;"/>

            <!-- Calves -->
            <ellipse cx="85" cy="310" rx="8" ry="28" fill="${getColor('Pantorrillas')}" opacity="${getOpacity('Pantorrillas')}" ${click('Pantorrillas')} style="cursor:pointer;"/>
            <ellipse cx="115" cy="310" rx="8" ry="28" fill="${getColor('Pantorrillas')}" opacity="${getOpacity('Pantorrillas')}" ${click('Pantorrillas')} style="cursor:pointer;"/>

            <!-- Feet -->
            <ellipse cx="85" cy="365" rx="10" ry="5" fill="#3a3a5a"/>
            <ellipse cx="115" cy="365" rx="10" ry="5" fill="#3a3a5a"/>

            <!-- Labels -->
            <text x="100" y="105" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">ROMBOIDES</text>
            <text x="72" y="118" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">DORSAL</text>
            <text x="128" y="118" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">DORSAL</text>
            <text x="100" y="145" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">LUMBAR</text>
            <text x="85" y="178" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">GLÚTEO</text>
            <text x="115" y="178" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">GLÚTEO</text>
            <text x="85" y="235" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">ISQUIO</text>
            <text x="115" y="235" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">ISQUIO</text>
            <text x="52" y="115" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">TRI</text>
            <text x="148" y="115" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">TRI</text>
            <text x="100" y="68" text-anchor="middle" font-size="5" fill="#888" pointer-events="none">TRAPECIOS</text>
        </svg>`;
    },

    // Muscle groups mapping for exercises
    muscleGroups: {
        'Pecho': { front: true, exercises: ['bench-press', 'incline-db-press', 'cable-fly-low', 'dip-chest', 'pec-deck', 'push-ups'] },
        'Hombros': { front: true, exercises: ['ohp', 'lateral-raise', 'cable-lateral-raise', 'db-shoulder-press', 'front-raise'] },
        'Deltoides Posterior': { front: false, exercises: ['rear-delt-fly', 'face-pulls', 'reverse-pec-deck'] },
        'Bíceps': { front: true, exercises: ['incline-curl', 'barbell-curl', 'hammer-curl', 'preacher-curl', 'cable-curl', 'spider-curl'] },
        'Tríceps': { front: false, exercises: ['overhead-cable-ext', 'close-grip-bench', 'tricep-pushdown', 'skull-crusher', 'dips', 'diamond-push-ups'] },
        'Dorsales': { front: false, exercises: ['pull-ups', 'lat-pulldown', 'straight-arm-pulldown', 'single-arm-row'] },
        'Espalda Media': { front: false, exercises: ['barbell-row', 'chest-supported-row', 'seated-cable-row', 'face-pulls'] },
        'Trapecios': { front: false, exercises: ['deadlift', 'shrugs', 'face-pulls', 'farmer-walks'] },
        'Lumbares': { front: false, exercises: ['deadlift', 'back-extension', 'good-morning', 'romanian-deadlift'] },
        'Core': { front: true, exercises: ['hanging-leg-raise', 'cable-crunch', 'ab-wheel', 'pallof-press', 'plank'] },
        'Oblicuos': { front: true, exercises: ['pallof-press', 'woodchop', 'side-plank', 'russian-twist'] },
        'Cuádriceps': { front: true, exercises: ['squat', 'bulgarian-split', 'leg-press', 'hack-squat', 'leg-extension', 'sissy-squat'] },
        'Isquiotibiales': { front: false, exercises: ['romanian-deadlift', 'lying-leg-curl', 'nordic-curl', 'good-morning', 'stiff-leg-deadlift'] },
        'Glúteos': { front: false, exercises: ['hip-thrust', 'bulgarian-split', 'romanian-deadlift', 'cable-kickback', 'glute-bridge', 'squat'] },
        'Aductores': { front: true, exercises: ['sumo-squat', 'adductor-machine', 'copenhagen-plank'] },
        'Pantorrillas': { front: true, exercises: ['seated-calf-raise', 'standing-calf-raise', 'donkey-calf-raise'] },
        'Antebrazos': { front: true, exercises: ['wrist-curl', 'reverse-curl', 'farmer-walks', 'dead-hang'] },
        'Hip Flexors': { front: true, exercises: ['hanging-leg-raise', 'decline-sit-ups'] },
        'Tibial': { front: true, exercises: ['tibialis-raise'] }
    },

    // Actions
    setView(view) {
        this.view = view;
        this.rerender();
    },

    toggleMuscle(muscle) {
        const idx = this.selectedMuscles.indexOf(muscle);
        if (idx >= 0) {
            this.selectedMuscles.splice(idx, 1);
        } else {
            this.selectedMuscles.push(muscle);
        }
        if (this.onSelectCallback) {
            this.onSelectCallback(this.selectedMuscles);
        }
        this.rerender();
    },

    deselectMuscle(muscle) {
        const idx = this.selectedMuscles.indexOf(muscle);
        if (idx >= 0) {
            this.selectedMuscles.splice(idx, 1);
        }
        if (this.onSelectCallback) {
            this.onSelectCallback(this.selectedMuscles);
        }
        this.rerender();
    },

    clearSelection() {
        this.selectedMuscles = [];
        this.rerender();
    },

    getExercisesForSelected() {
        const exerciseIds = new Set();
        this.selectedMuscles.forEach(muscle => {
            const group = this.muscleGroups[muscle];
            if (group) {
                group.exercises.forEach(id => exerciseIds.add(id));
            }
        });
        return [...exerciseIds].map(id => EXERCISES_DB.find(e => e.id === id)).filter(Boolean);
    },

    rerender() {
        // Re-render wherever the body map is displayed
        const container = document.getElementById('body-map-wrapper');
        if (container) {
            container.innerHTML = this.render({ selectable: true });
        }
        // Also update exercise suggestions if in routine builder
        if (typeof RoutineBuilder !== 'undefined' && RoutineBuilder.updateSuggestions) {
            RoutineBuilder.updateSuggestions();
        }
    }
};
