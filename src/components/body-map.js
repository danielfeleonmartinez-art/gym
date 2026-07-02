// ===== BODY MAP v3.0 - Cuerpo Anatómico Profesional =====
// Imagen real del cuerpo humano con músculos coloreados
// GIFs animados de ejercicios desde fuentes gratuitas
const BodyMap = {
    selectedMuscles: [],

    // Colores anatómicos reales por grupo muscular
    colors: {
        'Pecho': '#E53935',
        'Dorsales': '#1976D2',
        'Hombros': '#FF8F00',
        'Bíceps': '#D81B60',
        'Tríceps': '#00ACC1',
        'Trapecios': '#7CB342',
        'Core': '#FDD835',
        'Oblicuos': '#F9A825',
        'Cuádriceps': '#43A047',
        'Isquiotibiales': '#5E35B1',
        'Glúteos': '#8E24AA',
        'Pantorrillas': '#00897B',
        'Antebrazos': '#6D4C41',
        'Lumbares': '#3949AB',
        'Espalda Media': '#1565C0',
        'Aductores': '#C62828',
        'Deltoides Posterior': '#EF6C00',
        'Serratus': '#AD1457',
        'Piernas': '#43A047',
        'Espalda': '#1976D2',
    },


    // Muscle groups for the anatomical figure
    muscleAreas: {
        front: [
            { id: 'Trapecios', label: 'Trapezius', x: 50, y: 12, w: 18, h: 4 },
            { id: 'Hombros', label: 'Deltoid', x: 22, y: 15, w: 10, h: 7 },
            { id: 'Pecho', label: 'Pectoralis major', x: 35, y: 20, w: 30, h: 10 },
            { id: 'Bíceps', label: 'Biceps', x: 18, y: 28, w: 8, h: 12 },
            { id: 'Core', label: 'Abdominals', x: 42, y: 32, w: 16, h: 14 },
            { id: 'Oblicuos', label: 'External oblique', x: 34, y: 34, w: 8, h: 10 },
            { id: 'Antebrazos', label: 'Brachioradialis', x: 14, y: 40, w: 7, h: 12 },
            { id: 'Cuádriceps', label: 'Quadriceps', x: 34, y: 52, w: 14, h: 20 },
            { id: 'Aductores', label: 'Adductors', x: 44, y: 55, w: 8, h: 12 },
            { id: 'Pantorrillas', label: 'Gastrocnemius', x: 36, y: 76, w: 10, h: 14 },
        ],
        back: [
            { id: 'Trapecios', label: 'Trapezius', x: 40, y: 10, w: 20, h: 8 },
            { id: 'Deltoides Posterior', label: 'Rear Deltoid', x: 22, y: 15, w: 10, h: 6 },
            { id: 'Dorsales', label: 'Latissimus dorsi', x: 28, y: 22, w: 18, h: 14 },
            { id: 'Tríceps', label: 'Triceps', x: 18, y: 26, w: 8, h: 12 },
            { id: 'Espalda Media', label: 'Rhomboids', x: 40, y: 22, w: 14, h: 8 },
            { id: 'Lumbares', label: 'Erector spinae', x: 42, y: 34, w: 12, h: 10 },
            { id: 'Glúteos', label: 'Gluteus maximus', x: 36, y: 46, w: 16, h: 10 },
            { id: 'Isquiotibiales', label: 'Hamstrings', x: 34, y: 58, w: 14, h: 18 },
            { id: 'Pantorrillas', label: 'Soleus / Calves', x: 36, y: 78, w: 10, h: 12 },
        ]
    },

    render(options = {}) {
        const { selectable = true } = options;
        return `
        <div class="body-map-pro">
            <h3 class="body-map-title">Selecciona los músculos que quieres entrenar</h3>
            <p class="body-map-subtitle">Toca cada grupo muscular en el cuerpo</p>
            
            <div class="body-figures-row">
                <div class="body-fig-col">
                    <span class="fig-view-label">FRONTAL</span>
                    ${this.renderAnatomicalFront(selectable)}
                </div>
                <div class="body-fig-col">
                    <span class="fig-view-label">POSTERIOR</span>
                    ${this.renderAnatomicalBack(selectable)}
                </div>
            </div>

            <!-- Selected muscles -->
            ${this.selectedMuscles.length > 0 ? `
            <div class="selected-muscles-bar">
                <div class="selected-tags">
                    ${this.selectedMuscles.map(m => `
                        <span class="muscle-chip" style="--chip-color: ${this.colors[m] || '#6C63FF'};" onclick="BodyMap.deselectMuscle('${m}')">
                            <span class="chip-dot" style="background: ${this.colors[m]};"></span>
                            ${m}
                            <span class="chip-x">×</span>
                        </span>
                    `).join('')}
                </div>
                <button class="btn btn-primary btn-full mt-2" onclick="BodyMap.confirmSelection()">
                    💪 Ver ${this.getExercisesForSelected().length} ejercicios disponibles
                </button>
            </div>
            ` : `
            <div class="body-map-legend">
                ${Object.entries(this.colors).slice(0, 12).map(([name, color]) => `
                    <span class="legend-item" onclick="BodyMap.toggleMuscle('${name}')">
                        <span class="legend-dot" style="background: ${color};"></span>
                        <span class="legend-name">${name}</span>
                    </span>
                `).join('')}
            </div>
            `}
        </div>`;
    },


    renderAnatomicalFront(selectable) {
        const s = (m) => this.selectedMuscles.includes(m);
        const fill = (m) => s(m) ? this.colors[m] : this.colors[m] + '55';
        const stroke = (m) => s(m) ? this.colors[m] : this.colors[m] + '88';
        const cl = selectable ? (m) => `onclick="BodyMap.toggleMuscle('${m}')" class="muscle-zone ${s(m)?'active':''}"` : () => '';

        return `<svg viewBox="0 0 120 250" xmlns="http://www.w3.org/2000/svg">
<!-- Head & Neck -->
<ellipse cx="60" cy="18" rx="10" ry="13" fill="#1a1a2e" stroke="#333" stroke-width="0.5"/>
<rect x="55" y="30" width="10" height="8" rx="3" fill="#1a1a2e"/>
<!-- Traps (front) -->
<path d="M50 33 Q40 36 36 44 L44 42 Q50 37 56 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<path d="M70 33 Q80 36 84 44 L76 42 Q70 37 64 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<!-- Shoulders -->
<ellipse cx="34" cy="47" rx="9" ry="7" fill="${fill('Hombros')}" stroke="${stroke('Hombros')}" stroke-width="0.4" ${cl('Hombros')}/>
<ellipse cx="86" cy="47" rx="9" ry="7" fill="${fill('Hombros')}" stroke="${stroke('Hombros')}" stroke-width="0.4" ${cl('Hombros')}/>
<!-- Pectorals -->
<ellipse cx="48" cy="58" rx="12" ry="8" fill="${fill('Pecho')}" stroke="${stroke('Pecho')}" stroke-width="0.4" ${cl('Pecho')}/>
<ellipse cx="72" cy="58" rx="12" ry="8" fill="${fill('Pecho')}" stroke="${stroke('Pecho')}" stroke-width="0.4" ${cl('Pecho')}/>
<!-- Serratus -->
<path d="M37 60 Q35 68 36 74 L42 72 L42 61Z" fill="${fill('Serratus')}" stroke="${stroke('Serratus')}" stroke-width="0.2" ${cl('Serratus')}/>
<path d="M83 60 Q85 68 84 74 L78 72 L78 61Z" fill="${fill('Serratus')}" stroke="${stroke('Serratus')}" stroke-width="0.2" ${cl('Serratus')}/>
<!-- Biceps -->
<ellipse cx="28" cy="70" rx="5" ry="11" fill="${fill('Bíceps')}" stroke="${stroke('Bíceps')}" stroke-width="0.4" ${cl('Bíceps')}/>
<ellipse cx="92" cy="70" rx="5" ry="11" fill="${fill('Bíceps')}" stroke="${stroke('Bíceps')}" stroke-width="0.4" ${cl('Bíceps')}/>
<!-- Forearms -->
<ellipse cx="24" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<ellipse cx="96" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<!-- Abs/Core -->
<rect x="50" y="70" width="20" height="30" rx="4" fill="${fill('Core')}" stroke="${stroke('Core')}" stroke-width="0.4" ${cl('Core')}/>
<!-- Obliques -->
<path d="M42 72 Q40 85 42 100 L50 100 L50 70Z" fill="${fill('Oblicuos')}" stroke="${stroke('Oblicuos')}" stroke-width="0.3" ${cl('Oblicuos')}/>
<path d="M78 72 Q80 85 78 100 L70 100 L70 70Z" fill="${fill('Oblicuos')}" stroke="${stroke('Oblicuos')}" stroke-width="0.3" ${cl('Oblicuos')}/>
<!-- Quads -->
<ellipse cx="50" cy="135" rx="9" ry="28" fill="${fill('Cuádriceps')}" stroke="${stroke('Cuádriceps')}" stroke-width="0.4" ${cl('Cuádriceps')}/>
<ellipse cx="70" cy="135" rx="9" ry="28" fill="${fill('Cuádriceps')}" stroke="${stroke('Cuádriceps')}" stroke-width="0.4" ${cl('Cuádriceps')}/>
<!-- Adductors -->
<ellipse cx="57" cy="125" rx="4" ry="15" fill="${fill('Aductores')}" stroke="${stroke('Aductores')}" stroke-width="0.2" ${cl('Aductores')}/>
<ellipse cx="63" cy="125" rx="4" ry="15" fill="${fill('Aductores')}" stroke="${stroke('Aductores')}" stroke-width="0.2" ${cl('Aductores')}/>
<!-- Tibialis / Calves front -->
<ellipse cx="49" cy="195" rx="5" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<ellipse cx="71" cy="195" rx="5" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<!-- Feet -->
<ellipse cx="49" cy="228" rx="6" ry="3" fill="#1a1a2e"/>
<ellipse cx="71" cy="228" rx="6" ry="3" fill="#1a1a2e"/>
<!-- Labels (only when selected) -->
${s('Pecho') ? '<text x="60" y="60" text-anchor="middle" font-size="4" fill="'+this.colors['Pecho']+'" font-weight="700">PECHO</text>' : ''}
${s('Core') ? '<text x="60" y="88" text-anchor="middle" font-size="3.5" fill="'+this.colors['Core']+'" font-weight="700">CORE</text>' : ''}
${s('Cuádriceps') ? '<text x="60" y="140" text-anchor="middle" font-size="3.5" fill="'+this.colors['Cuádriceps']+'" font-weight="700">QUADS</text>' : ''}
${s('Bíceps') ? '<text x="16" y="72" font-size="3.5" fill="'+this.colors['Bíceps']+'" font-weight="700">BÍC</text>' : ''}
${s('Hombros') ? '<text x="28" y="42" font-size="3.5" fill="'+this.colors['Hombros']+'" font-weight="700">DELT</text>' : ''}
</svg>`;
    },


    renderAnatomicalBack(selectable) {
        const s = (m) => this.selectedMuscles.includes(m);
        const fill = (m) => s(m) ? this.colors[m] : this.colors[m] + '55';
        const stroke = (m) => s(m) ? this.colors[m] : this.colors[m] + '88';
        const cl = selectable ? (m) => `onclick="BodyMap.toggleMuscle('${m}')" class="muscle-zone ${s(m)?'active':''}"` : () => '';

        return `<svg viewBox="0 0 120 250" xmlns="http://www.w3.org/2000/svg">
<!-- Head & Neck -->
<ellipse cx="60" cy="18" rx="10" ry="13" fill="#1a1a2e" stroke="#333" stroke-width="0.5"/>
<rect x="55" y="30" width="10" height="8" rx="3" fill="#1a1a2e"/>
<!-- Traps -->
<path d="M48 32 Q36 37 32 47 L42 44 Q48 38 56 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<path d="M72 32 Q84 37 88 47 L78 44 Q72 38 64 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<rect x="48" y="40" width="24" height="12" rx="4" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<!-- Rear Delts -->
<ellipse cx="34" cy="48" rx="8" ry="6" fill="${fill('Deltoides Posterior')}" stroke="${stroke('Deltoides Posterior')}" stroke-width="0.3" ${cl('Deltoides Posterior')}/>
<ellipse cx="86" cy="48" rx="8" ry="6" fill="${fill('Deltoides Posterior')}" stroke="${stroke('Deltoides Posterior')}" stroke-width="0.3" ${cl('Deltoides Posterior')}/>
<!-- Lats -->
<path d="M38 55 Q34 70 36 88 L50 86 L50 56Z" fill="${fill('Dorsales')}" stroke="${stroke('Dorsales')}" stroke-width="0.4" ${cl('Dorsales')}/>
<path d="M82 55 Q86 70 84 88 L70 86 L70 56Z" fill="${fill('Dorsales')}" stroke="${stroke('Dorsales')}" stroke-width="0.4" ${cl('Dorsales')}/>
<!-- Rhomboids / Mid Back -->
<rect x="50" y="55" width="20" height="18" rx="4" fill="${fill('Espalda Media')}" stroke="${stroke('Espalda Media')}" stroke-width="0.3" ${cl('Espalda Media')}/>
<!-- Triceps -->
<ellipse cx="28" cy="68" rx="5" ry="12" fill="${fill('Tríceps')}" stroke="${stroke('Tríceps')}" stroke-width="0.4" ${cl('Tríceps')}/>
<ellipse cx="92" cy="68" rx="5" ry="12" fill="${fill('Tríceps')}" stroke="${stroke('Tríceps')}" stroke-width="0.4" ${cl('Tríceps')}/>
<!-- Forearms -->
<ellipse cx="24" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<ellipse cx="96" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<!-- Lower Back / Erectors -->
<rect x="50" y="76" width="20" height="22" rx="4" fill="${fill('Lumbares')}" stroke="${stroke('Lumbares')}" stroke-width="0.3" ${cl('Lumbares')}/>
<!-- Glutes -->
<ellipse cx="50" cy="108" rx="11" ry="9" fill="${fill('Glúteos')}" stroke="${stroke('Glúteos')}" stroke-width="0.4" ${cl('Glúteos')}/>
<ellipse cx="70" cy="108" rx="11" ry="9" fill="${fill('Glúteos')}" stroke="${stroke('Glúteos')}" stroke-width="0.4" ${cl('Glúteos')}/>
<!-- Hamstrings -->
<ellipse cx="50" cy="145" rx="9" ry="26" fill="${fill('Isquiotibiales')}" stroke="${stroke('Isquiotibiales')}" stroke-width="0.4" ${cl('Isquiotibiales')}/>
<ellipse cx="70" cy="145" rx="9" ry="26" fill="${fill('Isquiotibiales')}" stroke="${stroke('Isquiotibiales')}" stroke-width="0.4" ${cl('Isquiotibiales')}/>
<!-- Calves -->
<ellipse cx="50" cy="195" rx="6" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<ellipse cx="70" cy="195" rx="6" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<!-- Feet -->
<ellipse cx="50" cy="228" rx="6" ry="3" fill="#1a1a2e"/>
<ellipse cx="70" cy="228" rx="6" ry="3" fill="#1a1a2e"/>
<!-- Labels -->
${s('Dorsales') ? '<text x="60" y="72" text-anchor="middle" font-size="3.5" fill="'+this.colors['Dorsales']+'" font-weight="700">DORSAL</text>' : ''}
${s('Glúteos') ? '<text x="60" y="111" text-anchor="middle" font-size="3.5" fill="'+this.colors['Glúteos']+'" font-weight="700">GLÚTEO</text>' : ''}
${s('Isquiotibiales') ? '<text x="60" y="148" text-anchor="middle" font-size="3" fill="'+this.colors['Isquiotibiales']+'" font-weight="700">ISQUIOS</text>' : ''}
${s('Tríceps') ? '<text x="16" y="70" font-size="3.5" fill="'+this.colors['Tríceps']+'" font-weight="700">TRI</text>' : ''}
${s('Trapecios') ? '<text x="60" y="46" text-anchor="middle" font-size="3.5" fill="'+this.colors['Trapecios']+'" font-weight="700">TRAP</text>' : ''}
</svg>`;
    },


    renderAnatomicalBack(selectable) {
        const s = (m) => this.selectedMuscles.includes(m);
        const fill = (m) => s(m) ? this.colors[m] : this.colors[m] + '55';
        const stroke = (m) => s(m) ? this.colors[m] : this.colors[m] + '88';
        const cl = selectable ? (m) => `onclick="BodyMap.toggleMuscle('${m}')" class="muscle-zone ${s(m)?'active':''}"` : () => '';
        return `<svg viewBox="0 0 120 250" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="60" cy="18" rx="10" ry="13" fill="#1a1a2e" stroke="#333" stroke-width="0.5"/>
<rect x="55" y="30" width="10" height="8" rx="3" fill="#1a1a2e"/>
<path d="M48 32 Q36 37 32 47 L42 44 Q48 38 56 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<path d="M72 32 Q84 37 88 47 L78 44 Q72 38 64 34Z" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<rect x="48" y="40" width="24" height="12" rx="4" fill="${fill('Trapecios')}" stroke="${stroke('Trapecios')}" stroke-width="0.3" ${cl('Trapecios')}/>
<ellipse cx="34" cy="48" rx="8" ry="6" fill="${fill('Deltoides Posterior')}" stroke="${stroke('Deltoides Posterior')}" stroke-width="0.3" ${cl('Deltoides Posterior')}/>
<ellipse cx="86" cy="48" rx="8" ry="6" fill="${fill('Deltoides Posterior')}" stroke="${stroke('Deltoides Posterior')}" stroke-width="0.3" ${cl('Deltoides Posterior')}/>
<path d="M38 55 Q34 70 36 88 L50 86 L50 56Z" fill="${fill('Dorsales')}" stroke="${stroke('Dorsales')}" stroke-width="0.4" ${cl('Dorsales')}/>
<path d="M82 55 Q86 70 84 88 L70 86 L70 56Z" fill="${fill('Dorsales')}" stroke="${stroke('Dorsales')}" stroke-width="0.4" ${cl('Dorsales')}/>
<rect x="50" y="55" width="20" height="18" rx="4" fill="${fill('Espalda Media')}" stroke="${stroke('Espalda Media')}" stroke-width="0.3" ${cl('Espalda Media')}/>
<ellipse cx="28" cy="68" rx="5" ry="12" fill="${fill('Tríceps')}" stroke="${stroke('Tríceps')}" stroke-width="0.4" ${cl('Tríceps')}/>
<ellipse cx="92" cy="68" rx="5" ry="12" fill="${fill('Tríceps')}" stroke="${stroke('Tríceps')}" stroke-width="0.4" ${cl('Tríceps')}/>
<ellipse cx="24" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<ellipse cx="96" cy="92" rx="4" ry="12" fill="${fill('Antebrazos')}" stroke="${stroke('Antebrazos')}" stroke-width="0.3" ${cl('Antebrazos')}/>
<rect x="50" y="76" width="20" height="22" rx="4" fill="${fill('Lumbares')}" stroke="${stroke('Lumbares')}" stroke-width="0.3" ${cl('Lumbares')}/>
<ellipse cx="50" cy="108" rx="11" ry="9" fill="${fill('Glúteos')}" stroke="${stroke('Glúteos')}" stroke-width="0.4" ${cl('Glúteos')}/>
<ellipse cx="70" cy="108" rx="11" ry="9" fill="${fill('Glúteos')}" stroke="${stroke('Glúteos')}" stroke-width="0.4" ${cl('Glúteos')}/>
<ellipse cx="50" cy="145" rx="9" ry="26" fill="${fill('Isquiotibiales')}" stroke="${stroke('Isquiotibiales')}" stroke-width="0.4" ${cl('Isquiotibiales')}/>
<ellipse cx="70" cy="145" rx="9" ry="26" fill="${fill('Isquiotibiales')}" stroke="${stroke('Isquiotibiales')}" stroke-width="0.4" ${cl('Isquiotibiales')}/>
<ellipse cx="50" cy="195" rx="6" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<ellipse cx="70" cy="195" rx="6" ry="20" fill="${fill('Pantorrillas')}" stroke="${stroke('Pantorrillas')}" stroke-width="0.3" ${cl('Pantorrillas')}/>
<ellipse cx="50" cy="228" rx="6" ry="3" fill="#1a1a2e"/><ellipse cx="70" cy="228" rx="6" ry="3" fill="#1a1a2e"/>
${s('Dorsales')?'<text x="60" y="72" text-anchor="middle" font-size="4" fill="'+this.colors['Dorsales']+'" font-weight="700">DORSAL</text>':''}
${s('Glúteos')?'<text x="60" y="111" text-anchor="middle" font-size="3.5" fill="'+this.colors['Glúteos']+'" font-weight="700">GLÚTEO</text>':''}
${s('Isquiotibiales')?'<text x="60" y="148" text-anchor="middle" font-size="3" fill="'+this.colors['Isquiotibiales']+'" font-weight="700">ISQUIOS</text>':''}
${s('Tríceps')?'<text x="16" y="70" font-size="3.5" fill="'+this.colors['Tríceps']+'" font-weight="700">TRI</text>':''}
</svg>`;
    },


    // ===== EXERCISE GIF/VIDEO SYSTEM =====
    // Uses free exercise GIF sources for animated demonstrations
    getExerciseMedia(exerciseId) {
        // Map exercise IDs to free GIF/image URLs from public sources
        const mediaMap = {
            'bench-press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif',
            'incline-db-press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Press.gif',
            'squat': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif',
            'deadlift': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif',
            'pull-ups': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif',
            'barbell-row': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bent-Over-Row.gif',
            'ohp': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Overhead-Press.gif',
            'lateral-raise': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Lateral-Raise.gif',
            'barbell-curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Curl.gif',
            'hammer-curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hammer-Curl.gif',
            'tricep-pushdown': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pushdown.gif',
            'skull-crusher': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Triceps-Extension.gif',
            'leg-press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Leg-Press.gif',
            'leg-extension': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/LEG-EXTENSION.gif',
            'lying-leg-curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lying-Leg-Curl.gif',
            'romanian-deadlift': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Romanian-Deadlift.gif',
            'hip-thrust': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Hip-Thrust.gif',
            'cable-fly-low': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Low-Cable-Crossover.gif',
            'lat-pulldown': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Lat-Pulldown.gif',
            'seated-cable-row': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Cable-Row.gif',
            'face-pulls': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Face-Pull.gif',
            'dips': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Triceps-Dip.gif',
            'bulgarian-split': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Bulgarian-Split-Squat.gif',
            'hanging-leg-raise': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hanging-Leg-Raise.gif',
            'cable-crunch': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Cable-Crunch.gif',
            'incline-curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Incline-Dumbbell-Curl.gif',
            'preacher-curl': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Preacher-Curl.gif',
            'overhead-cable-ext': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Overhead-Triceps-Extension.gif',
            'close-grip-bench': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Close-Grip-Bench-Press.gif',
            'hack-squat': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Hack-Squat.gif',
            'standing-calf-raise': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Calf-Raise.gif',
            'seated-calf-raise': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Seated-Calf-Raise.gif',
            'db-shoulder-press': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Shoulder-Press.gif',
            'rear-delt-fly': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Rear-Delt-Fly.gif',
            'pec-deck': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Pec-Deck-Fly.gif',
            'cable-lateral-raise': 'https://fitnessprogramer.com/wp-content/uploads/2021/06/One-Arm-Cable-Lateral-Raise.gif',
            'push-ups': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-Up.gif',
            'plank': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Front-Plank.gif',
            'walking-lunge': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Walking-Lunge.gif',
            'front-squat': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Front-Squat.gif',
            'good-morning': 'https://fitnessprogramer.com/wp-content/uploads/2021/02/Good-Morning.gif',
        };
        return mediaMap[exerciseId] || null;
    },

    // Actions
    toggleMuscle(muscle) {
        const idx = this.selectedMuscles.indexOf(muscle);
        if (idx >= 0) this.selectedMuscles.splice(idx, 1);
        else this.selectedMuscles.push(muscle);
        this.rerender();
    },
    deselectMuscle(muscle) {
        const idx = this.selectedMuscles.indexOf(muscle);
        if (idx >= 0) this.selectedMuscles.splice(idx, 1);
        this.rerender();
    },
    clearSelection() { this.selectedMuscles = []; this.rerender(); },
    confirmSelection() {
        if (this.selectedMuscles.length > 0) ExercisesPage.filterByMuscles(this.selectedMuscles);
    },
    getExercisesForSelected() {
        if (this.selectedMuscles.length === 0) return [];
        return EXERCISES_DB.filter(ex =>
            this.selectedMuscles.includes(ex.muscle) ||
            (ex.secondary && ex.secondary.some(s => this.selectedMuscles.includes(s)))
        );
    },
    rerender() {
        const c = document.getElementById('body-map-wrapper');
        if (c) c.innerHTML = this.render({ selectable: true });
    }
};
