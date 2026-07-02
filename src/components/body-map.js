// ===== BODY MAP v2.0 - Muñeco Anatómico con Colores Reales =====
// Inspirado en chart anatómico profesional: cada músculo con color único
const BodyMap = {
    selectedMuscles: [],
    view: 'both', // 'both' shows front + back side by side

    // Colores anatómicos por grupo muscular (como imagen de referencia)
    colors: {
        'Pecho': '#E53935',           // Rojo
        'Dorsales': '#1E88E5',        // Azul
        'Hombros': '#FF8F00',         // Naranja
        'Bíceps': '#D81B60',          // Rosa/Magenta
        'Tríceps': '#00ACC1',         // Cyan
        'Trapecios': '#7CB342',       // Verde lima
        'Core': '#FDD835',            // Amarillo
        'Oblicuos': '#F9A825',        // Amarillo oscuro
        'Cuádriceps': '#43A047',      // Verde
        'Isquiotibiales': '#5E35B1',  // Morado
        'Glúteos': '#8E24AA',         // Púrpura
        'Pantorrillas': '#00897B',    // Teal
        'Antebrazos': '#6D4C41',     // Marrón
        'Lumbares': '#3949AB',        // Indigo
        'Espalda Media': '#1565C0',   // Azul oscuro
        'Aductores': '#C62828',       // Rojo oscuro
        'Deltoides Posterior': '#EF6C00', // Naranja oscuro
        'Serratus': '#AD1457',        // Rosa oscuro
    },

    render(options = {}) {
        const { selectable = true } = options;
        this.selectableMode = selectable;

        return `
        <div class="body-map-v2">
            <div class="body-map-title">
                <h3 style="font-size: 1rem; font-weight: 700; text-align: center; margin-bottom: 0.5rem;">
                    👆 Selecciona los músculos que quieres entrenar
                </h3>
                <p style="font-size: 0.75rem; color: var(--text-muted); text-align: center;">
                    Toca cada músculo para seleccionarlo
                </p>
            </div>


            <div class="body-map-figures">
                <!-- Both views side by side -->
                <div class="body-figure">
                    <p class="figure-label">FRONTAL</p>
                    ${this.renderFrontSVG(selectable)}
                </div>
                <div class="body-figure">
                    <p class="figure-label">POSTERIOR</p>
                    ${this.renderBackSVG(selectable)}
                </div>
            </div>

            ${this.selectedMuscles.length > 0 ? `
                <div class="body-map-selection">
                    <div class="flex flex-wrap gap-1" style="justify-content: center;">
                        ${this.selectedMuscles.map(m => `
                            <span class="muscle-tag" style="background: ${this.colors[m] || '#6C63FF'}22; border: 1px solid ${this.colors[m] || '#6C63FF'}; color: ${this.colors[m] || '#6C63FF'};" onclick="BodyMap.deselectMuscle('${m}')">
                                ${m} ✕
                            </span>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary btn-sm mt-2" style="width: 100%;" onclick="BodyMap.confirmSelection()">
                        💪 Ver ejercicios para ${this.selectedMuscles.length} músculo${this.selectedMuscles.length > 1 ? 's' : ''}
                    </button>
                </div>
            ` : ''}
        </div>`;
    },

    renderFrontSVG(selectable) {
        const s = (m) => this.selectedMuscles.includes(m);
        const c = (m) => s(m) ? this.colors[m] : (this.colors[m] + '66');
        const o = (m) => s(m) ? '1' : '0.7';
        const cl = selectable ? (m) => `onclick="BodyMap.toggleMuscle('${m}')" style="cursor:pointer;"` : () => '';


        return `
        <svg viewBox="0 0 180 400" xmlns="http://www.w3.org/2000/svg">
            <!-- Body outline -->
            <ellipse cx="90" cy="28" rx="16" ry="20" fill="#2a2a3a" stroke="#444" stroke-width="0.5"/>
            <rect x="83" y="46" width="14" height="12" rx="3" fill="#2a2a3a"/>

            <!-- Trapecios (front) -->
            <path d="M 76 52 Q 66 57 62 68 L 72 66 Q 80 58 85 54 Z" fill="${c('Trapecios')}" opacity="${o('Trapecios')}" ${cl('Trapecios')}/>
            <path d="M 104 52 Q 114 57 118 68 L 108 66 Q 100 58 95 54 Z" fill="${c('Trapecios')}" opacity="${o('Trapecios')}" ${cl('Trapecios')}/>

            <!-- Deltoides / Hombros -->
            <ellipse cx="58" cy="74" rx="12" ry="11" fill="${c('Hombros')}" opacity="${o('Hombros')}" ${cl('Hombros')}/>
            <ellipse cx="122" cy="74" rx="12" ry="11" fill="${c('Hombros')}" opacity="${o('Hombros')}" ${cl('Hombros')}/>

            <!-- Pectorales / Pecho -->
            <ellipse cx="78" cy="90" rx="15" ry="12" fill="${c('Pecho')}" opacity="${o('Pecho')}" ${cl('Pecho')}/>
            <ellipse cx="102" cy="90" rx="15" ry="12" fill="${c('Pecho')}" opacity="${o('Pecho')}" ${cl('Pecho')}/>

            <!-- Bíceps -->
            <ellipse cx="48" cy="108" rx="7" ry="16" fill="${c('Bíceps')}" opacity="${o('Bíceps')}" ${cl('Bíceps')}/>
            <ellipse cx="132" cy="108" rx="7" ry="16" fill="${c('Bíceps')}" opacity="${o('Bíceps')}" ${cl('Bíceps')}/>

            <!-- Antebrazos -->
            <ellipse cx="44" cy="140" rx="5" ry="16" fill="${c('Antebrazos')}" opacity="${o('Antebrazos')}" ${cl('Antebrazos')}/>
            <ellipse cx="136" cy="140" rx="5" ry="16" fill="${c('Antebrazos')}" opacity="${o('Antebrazos')}" ${cl('Antebrazos')}/>

            <!-- Serratus -->
            <path d="M 65 95 Q 63 105 64 112 L 70 110 L 70 97 Z" fill="${c('Serratus')}" opacity="${o('Serratus')}" ${cl('Serratus')}/>
            <path d="M 115 95 Q 117 105 116 112 L 110 110 L 110 97 Z" fill="${c('Serratus')}" opacity="${o('Serratus')}" ${cl('Serratus')}/>

            <!-- Abdominales / Core -->
            <rect x="80" y="106" width="20" height="40" rx="4" fill="${c('Core')}" opacity="${o('Core')}" ${cl('Core')}/>


            <!-- Oblicuos -->
            <path d="M 70 108 Q 68 125 70 145 L 80 145 L 80 106 Z" fill="${c('Oblicuos')}" opacity="${o('Oblicuos')}" ${cl('Oblicuos')}/>
            <path d="M 110 108 Q 112 125 110 145 L 100 145 L 100 106 Z" fill="${c('Oblicuos')}" opacity="${o('Oblicuos')}" ${cl('Oblicuos')}/>

            <!-- Aductores -->
            <ellipse cx="83" cy="195" rx="5" ry="22" fill="${c('Aductores')}" opacity="${o('Aductores')}" ${cl('Aductores')}/>
            <ellipse cx="97" cy="195" rx="5" ry="22" fill="${c('Aductores')}" opacity="${o('Aductores')}" ${cl('Aductores')}/>

            <!-- Cuádriceps -->
            <ellipse cx="76" cy="210" rx="11" ry="38" fill="${c('Cuádriceps')}" opacity="${o('Cuádriceps')}" ${cl('Cuádriceps')}/>
            <ellipse cx="104" cy="210" rx="11" ry="38" fill="${c('Cuádriceps')}" opacity="${o('Cuádriceps')}" ${cl('Cuádriceps')}/>

            <!-- Pantorrillas (frontal) -->
            <ellipse cx="78" cy="300" rx="6" ry="24" fill="${c('Pantorrillas')}" opacity="${o('Pantorrillas')}" ${cl('Pantorrillas')}/>
            <ellipse cx="102" cy="300" rx="6" ry="24" fill="${c('Pantorrillas')}" opacity="${o('Pantorrillas')}" ${cl('Pantorrillas')}/>

            <!-- Pies -->
            <ellipse cx="78" cy="345" rx="8" ry="4" fill="#2a2a3a"/>
            <ellipse cx="102" cy="345" rx="8" ry="4" fill="#2a2a3a"/>

            <!-- LABELS -->
            <text x="10" y="74" font-size="5.5" fill="${this.colors['Hombros']}" font-weight="600">Deltoides</text>
            <line x1="33" y1="73" x2="47" y2="74" stroke="${this.colors['Hombros']}" stroke-width="0.4"/>
            <text x="138" y="90" font-size="5.5" fill="${this.colors['Pecho']}" font-weight="600">Pectorales</text>
            <line x1="137" y1="89" x2="116" y2="90" stroke="${this.colors['Pecho']}" stroke-width="0.4"/>
            <text x="4" y="108" font-size="5" fill="${this.colors['Bíceps']}" font-weight="600">Bíceps</text>
            <line x1="26" y1="107" x2="42" y2="108" stroke="${this.colors['Bíceps']}" stroke-width="0.4"/>
            <text x="4" y="140" font-size="4.5" fill="${this.colors['Antebrazos']}" font-weight="600">Antebrazos</text>
            <line x1="32" y1="139" x2="40" y2="140" stroke="${this.colors['Antebrazos']}" stroke-width="0.4"/>
            <text x="135" y="130" font-size="5.5" fill="${this.colors['Core']}" font-weight="600">Abdominales</text>
            <line x1="134" y1="129" x2="100" y2="125" stroke="${this.colors['Core']}" stroke-width="0.4"/>
            <text x="130" y="140" font-size="4.5" fill="${this.colors['Oblicuos']}" font-weight="600">Oblicuos</text>
            <line x1="129" y1="139" x2="112" y2="130" stroke="${this.colors['Oblicuos']}" stroke-width="0.4"/>
            <text x="8" y="210" font-size="5.5" fill="${this.colors['Cuádriceps']}" font-weight="600">Cuádriceps</text>
            <line x1="40" y1="209" x2="66" y2="210" stroke="${this.colors['Cuádriceps']}" stroke-width="0.4"/>
            <text x="120" y="200" font-size="4.5" fill="${this.colors['Aductores']}" font-weight="600">Aductores</text>
            <line x1="119" y1="199" x2="101" y2="195" stroke="${this.colors['Aductores']}" stroke-width="0.4"/>
            <text x="120" y="300" font-size="4.5" fill="${this.colors['Pantorrillas']}" font-weight="600">Pantorrillas</text>
            <line x1="119" y1="299" x2="108" y2="300" stroke="${this.colors['Pantorrillas']}" stroke-width="0.4"/>
            <text x="60" y="55" font-size="4.5" fill="${this.colors['Trapecios']}" font-weight="600">Trapecios</text>
        </svg>`;
    },


    renderBackSVG(selectable) {
        const s = (m) => this.selectedMuscles.includes(m);
        const c = (m) => s(m) ? this.colors[m] : (this.colors[m] + '66');
        const o = (m) => s(m) ? '1' : '0.7';
        const cl = selectable ? (m) => `onclick="BodyMap.toggleMuscle('${m}')" style="cursor:pointer;"` : () => '';

        return `
        <svg viewBox="0 0 180 400" xmlns="http://www.w3.org/2000/svg">
            <!-- Body outline -->
            <ellipse cx="90" cy="28" rx="16" ry="20" fill="#2a2a3a" stroke="#444" stroke-width="0.5"/>
            <rect x="83" y="46" width="14" height="12" rx="3" fill="#2a2a3a"/>

            <!-- Trapecios -->
            <path d="M 74 50 Q 60 56 56 68 L 68 65 Q 76 56 84 52 Z" fill="${c('Trapecios')}" opacity="${o('Trapecios')}" ${cl('Trapecios')}/>
            <path d="M 106 50 Q 120 56 124 68 L 112 65 Q 104 56 96 52 Z" fill="${c('Trapecios')}" opacity="${o('Trapecios')}" ${cl('Trapecios')}/>
            <rect x="76" y="66" width="28" height="15" rx="4" fill="${c('Trapecios')}" opacity="${o('Trapecios')}" ${cl('Trapecios')}/>

            <!-- Deltoides Posterior -->
            <ellipse cx="56" cy="76" rx="11" ry="9" fill="${c('Deltoides Posterior')}" opacity="${o('Deltoides Posterior')}" ${cl('Deltoides Posterior')}/>
            <ellipse cx="124" cy="76" rx="11" ry="9" fill="${c('Deltoides Posterior')}" opacity="${o('Deltoides Posterior')}" ${cl('Deltoides Posterior')}/>

            <!-- Dorsales / Lats -->
            <path d="M 66 84 Q 62 105 64 130 L 78 128 L 78 86 Z" fill="${c('Dorsales')}" opacity="${o('Dorsales')}" ${cl('Dorsales')}/>
            <path d="M 114 84 Q 118 105 116 130 L 102 128 L 102 86 Z" fill="${c('Dorsales')}" opacity="${o('Dorsales')}" ${cl('Dorsales')}/>

            <!-- Espalda Media / Romboides -->
            <rect x="78" y="84" width="24" height="24" rx="4" fill="${c('Espalda Media')}" opacity="${o('Espalda Media')}" ${cl('Espalda Media')}/>

            <!-- Tríceps -->
            <ellipse cx="48" cy="106" rx="7" ry="16" fill="${c('Tríceps')}" opacity="${o('Tríceps')}" ${cl('Tríceps')}/>
            <ellipse cx="132" cy="106" rx="7" ry="16" fill="${c('Tríceps')}" opacity="${o('Tríceps')}" ${cl('Tríceps')}/>

            <!-- Antebrazos -->
            <ellipse cx="44" cy="140" rx="5" ry="16" fill="${c('Antebrazos')}" opacity="${o('Antebrazos')}" ${cl('Antebrazos')}/>
            <ellipse cx="136" cy="140" rx="5" ry="16" fill="${c('Antebrazos')}" opacity="${o('Antebrazos')}" ${cl('Antebrazos')}/>


            <!-- Lumbares / Erectores -->
            <rect x="80" y="112" width="20" height="32" rx="4" fill="${c('Lumbares')}" opacity="${o('Lumbares')}" ${cl('Lumbares')}/>

            <!-- Glúteos -->
            <ellipse cx="79" cy="162" rx="14" ry="13" fill="${c('Glúteos')}" opacity="${o('Glúteos')}" ${cl('Glúteos')}/>
            <ellipse cx="101" cy="162" rx="14" ry="13" fill="${c('Glúteos')}" opacity="${o('Glúteos')}" ${cl('Glúteos')}/>

            <!-- Isquiotibiales -->
            <ellipse cx="77" cy="218" rx="11" ry="35" fill="${c('Isquiotibiales')}" opacity="${o('Isquiotibiales')}" ${cl('Isquiotibiales')}/>
            <ellipse cx="103" cy="218" rx="11" ry="35" fill="${c('Isquiotibiales')}" opacity="${o('Isquiotibiales')}" ${cl('Isquiotibiales')}/>

            <!-- Pantorrillas -->
            <ellipse cx="78" cy="298" rx="7" ry="26" fill="${c('Pantorrillas')}" opacity="${o('Pantorrillas')}" ${cl('Pantorrillas')}/>
            <ellipse cx="102" cy="298" rx="7" ry="26" fill="${c('Pantorrillas')}" opacity="${o('Pantorrillas')}" ${cl('Pantorrillas')}/>

            <!-- Pies -->
            <ellipse cx="78" cy="345" rx="8" ry="4" fill="#2a2a3a"/>
            <ellipse cx="102" cy="345" rx="8" ry="4" fill="#2a2a3a"/>

            <!-- LABELS -->
            <text x="125" y="54" font-size="4.5" fill="${this.colors['Trapecios']}" font-weight="600">Trapecios</text>
            <line x1="124" y1="53" x2="106" y2="55" stroke="${this.colors['Trapecios']}" stroke-width="0.4"/>
            <text x="130" y="76" font-size="4.5" fill="${this.colors['Deltoides Posterior']}" font-weight="600">Delt. Post.</text>
            <line x1="129" y1="75" x2="124" y2="76" stroke="${this.colors['Deltoides Posterior']}" stroke-width="0.4"/>
            <text x="130" y="100" font-size="5" fill="${this.colors['Dorsales']}" font-weight="600">Dorsales</text>
            <line x1="129" y1="99" x2="118" y2="105" stroke="${this.colors['Dorsales']}" stroke-width="0.4"/>
            <text x="4" y="106" font-size="5" fill="${this.colors['Tríceps']}" font-weight="600">Tríceps</text>
            <line x1="28" y1="105" x2="42" y2="106" stroke="${this.colors['Tríceps']}" stroke-width="0.4"/>
            <text x="130" y="126" font-size="4.5" fill="${this.colors['Lumbares']}" font-weight="600">Lumbares</text>
            <line x1="129" y1="125" x2="100" y2="126" stroke="${this.colors['Lumbares']}" stroke-width="0.4"/>
            <text x="4" y="162" font-size="5" fill="${this.colors['Glúteos']}" font-weight="600">Glúteos</text>
            <line x1="27" y1="161" x2="66" y2="162" stroke="${this.colors['Glúteos']}" stroke-width="0.4"/>
            <text x="125" y="218" font-size="4.5" fill="${this.colors['Isquiotibiales']}" font-weight="600">Isquiotibiales</text>
            <line x1="124" y1="217" x2="114" y2="218" stroke="${this.colors['Isquiotibiales']}" stroke-width="0.4"/>
            <text x="4" y="298" font-size="4.5" fill="${this.colors['Pantorrillas']}" font-weight="600">Pantorrillas</text>
            <line x1="38" y1="297" x2="71" y2="298" stroke="${this.colors['Pantorrillas']}" stroke-width="0.4"/>
            <text x="4" y="95" font-size="4.5" fill="${this.colors['Espalda Media']}" font-weight="600">Romboides</text>
            <line x1="36" y1="94" x2="78" y2="95" stroke="${this.colors['Espalda Media']}" stroke-width="0.4"/>
        </svg>`;
    },


    // ===== EXERCISE ILLUSTRATION SYSTEM =====
    // SVG illustrations showing how to perform exercises
    getExerciseIllustration(exerciseId) {
        const illustrations = {
            'bench-press': this.drawBenchPress(),
            'squat': this.drawSquat(),
            'deadlift': this.drawDeadlift(),
            'pull-ups': this.drawPullUps(),
            'barbell-row': this.drawBarbellRow(),
            'ohp': this.drawOHP(),
            'incline-db-press': this.drawInclinePress(),
            'lateral-raise': this.drawLateralRaise(),
            'barbell-curl': this.drawBarbellCurl(),
            'tricep-pushdown': this.drawTricepPushdown(),
            'leg-press': this.drawLegPress(),
            'romanian-deadlift': this.drawRDL(),
            'hip-thrust': this.drawHipThrust(),
            'hanging-leg-raise': this.drawHangingLegRaise(),
            'cable-fly-low': this.drawCableFly(),
            'face-pulls': this.drawFacePulls(),
        };
        return illustrations[exerciseId] || this.drawGenericExercise(exerciseId);
    },

    // Helper: draw a stick figure
    figure(x, y, pose, scale = 1) {
        // Base stick figure parts
        const s = scale;
        const head = `<circle cx="${x}" cy="${y}" r="${5*s}" fill="none" stroke="#B8B8D0" stroke-width="1.5"/>`;
        return head;
    },

    drawBenchPress() {
        return `<svg viewBox="0 0 200 120" class="exercise-illust">
            <!-- Bench -->
            <rect x="40" y="75" width="120" height="8" rx="3" fill="#444"/>
            <rect x="55" y="83" width="8" height="25" fill="#555"/>
            <rect x="137" y="83" width="8" height="25" fill="#555"/>
            <!-- Person lying down -->
            <circle cx="80" cy="62" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="80" y1="70" x2="80" y2="74" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="80" y1="74" x2="60" y2="74" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="80" y1="74" x2="140" y2="74" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="140" y1="74" x2="145" y2="90" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="60" y1="74" x2="55" y2="90" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Arms pushing bar up -->
            <line x1="90" y1="72" x2="90" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="110" y1="72" x2="110" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Barbell -->
            <line x1="50" y1="45" x2="150" y2="45" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="50" cy="45" r="6" fill="#6C63FF" opacity="0.6"/>
            <circle cx="150" cy="45" r="6" fill="#6C63FF" opacity="0.6"/>
            <!-- Arrow showing movement -->
            <path d="M 100 38 L 100 28 L 95 33 M 100 28 L 105 33" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="100" y="22" text-anchor="middle" font-size="8" fill="#4ECDC4">EMPUJA</text>
        </svg>`;
    },

    drawSquat() {
        return `<svg viewBox="0 0 200 140" class="exercise-illust">
            <!-- Person in squat position -->
            <circle cx="100" cy="30" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Torso (slightly forward) -->
            <line x1="100" y1="38" x2="95" y2="70" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Thighs (parallel) -->
            <line x1="95" y1="70" x2="75" y2="95" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="70" x2="115" y2="95" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Shins -->
            <line x1="75" y1="95" x2="80" y2="125" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="115" y1="95" x2="110" y2="125" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Arms holding bar on back -->
            <line x1="100" y1="42" x2="70" y2="38" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="42" x2="130" y2="38" stroke="#B8B8D0" stroke-width="2"/>
            <!-- Barbell on back -->
            <line x1="60" y1="38" x2="140" y2="38" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="60" cy="38" r="5" fill="#6C63FF" opacity="0.6"/>
            <circle cx="140" cy="38" r="5" fill="#6C63FF" opacity="0.6"/>
            <!-- Arrows -->
            <path d="M 55 85 L 55 65 L 50 70 M 55 65 L 60 70" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="45" y="60" font-size="7" fill="#4ECDC4">SUBE</text>
            <!-- Depth line -->
            <line x1="65" y1="95" x2="125" y2="95" stroke="#FF6B6B" stroke-width="0.5" stroke-dasharray="3,3"/>
            <text x="130" y="98" font-size="6" fill="#FF6B6B">paralelo</text>
        </svg>`;
    },


    drawDeadlift() {
        return `<svg viewBox="0 0 200 140" class="exercise-illust">
            <circle cx="100" cy="35" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="43" x2="95" y2="75" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="75" x2="80" y2="105" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="75" x2="110" y2="105" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="80" y1="105" x2="80" y2="130" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="110" y1="105" x2="110" y2="130" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="50" x2="80" y2="75" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="50" x2="120" y2="75" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="60" y1="120" x2="140" y2="120" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="60" cy="120" r="6" fill="#6C63FF" opacity="0.6"/>
            <circle cx="140" cy="120" r="6" fill="#6C63FF" opacity="0.6"/>
            <path d="M 145 80 L 145 55 L 140 60 M 145 55 L 150 60" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="148" y="50" font-size="7" fill="#4ECDC4">EMPUJA</text>
            <text x="148" y="58" font-size="6" fill="#4ECDC4">el suelo</text>
            <text x="60" y="48" font-size="6" fill="#FF6B6B">Espalda</text>
            <text x="60" y="56" font-size="6" fill="#FF6B6B">NEUTRA</text>
        </svg>`;
    },

    drawPullUps() {
        return `<svg viewBox="0 0 200 140" class="exercise-illust">
            <line x1="40" y1="15" x2="160" y2="15" stroke="#555" stroke-width="4"/>
            <circle cx="100" cy="40" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="48" x2="100" y2="85" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="85" x2="90" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="85" x2="110" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="80" y2="18" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="120" y2="18" stroke="#B8B8D0" stroke-width="2"/>
            <circle cx="80" cy="16" r="3" fill="#6C63FF"/>
            <circle cx="120" cy="16" r="3" fill="#6C63FF"/>
            <path d="M 60 70 L 60 45 L 55 50 M 60 45 L 65 50" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="40" y="40" font-size="7" fill="#4ECDC4">TIRA</text>
            <text x="130" y="55" font-size="6" fill="#FF6B6B">Retrae</text>
            <text x="130" y="63" font-size="6" fill="#FF6B6B">escápulas</text>
        </svg>`;
    },

    drawOHP() {
        return `<svg viewBox="0 0 200 140" class="exercise-illust">
            <circle cx="100" cy="50" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="58" x2="100" y2="95" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="95" x2="85" y2="130" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="95" x2="115" y2="130" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="65" x2="80" y2="30" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="65" x2="120" y2="30" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="65" y1="28" x2="135" y2="28" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="65" cy="28" r="5" fill="#6C63FF" opacity="0.6"/>
            <circle cx="135" cy="28" r="5" fill="#6C63FF" opacity="0.6"/>
            <path d="M 100 22 L 100 10 L 95 15 M 100 10 L 105 15" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="100" y="7" text-anchor="middle" font-size="7" fill="#4ECDC4">EMPUJA</text>
        </svg>`;
    },


    drawInclinePress() {
        return `<svg viewBox="0 0 200 120" class="exercise-illust">
            <path d="M 50 90 L 80 50 L 140 50 L 140 90 Z" fill="#333" stroke="#555" stroke-width="1"/>
            <circle cx="95" cy="42" r="7" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="49" x2="110" y2="70" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="53" x2="85" y2="25" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="95" y1="53" x2="115" y2="25" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="70" y1="23" x2="140" y2="23" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="70" cy="23" r="4" fill="#6C63FF" opacity="0.6"/>
            <circle cx="140" cy="23" r="4" fill="#6C63FF" opacity="0.6"/>
            <text x="100" y="13" text-anchor="middle" font-size="7" fill="#4ECDC4">30° inclinación</text>
            <text x="150" y="55" font-size="6" fill="#FF6B6B">Pecho</text>
            <text x="150" y="63" font-size="6" fill="#FF6B6B">superior</text>
        </svg>`;
    },

    drawLateralRaise() {
        return `<svg viewBox="0 0 200 130" class="exercise-illust">
            <circle cx="100" cy="25" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="33" x2="100" y2="80" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="80" x2="90" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="80" x2="110" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="45" x2="60" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="45" x2="140" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <circle cx="60" cy="45" r="4" fill="#6C63FF"/>
            <circle cx="140" cy="45" r="4" fill="#6C63FF"/>
            <path d="M 55 55 Q 55 30 75 25" stroke="#4ECDC4" stroke-width="1.2" fill="none" stroke-dasharray="3,2"/>
            <path d="M 145 55 Q 145 30 125 25" stroke="#4ECDC4" stroke-width="1.2" fill="none" stroke-dasharray="3,2"/>
            <text x="30" y="20" font-size="7" fill="#4ECDC4">75-80°</text>
            <text x="100" y="100" text-anchor="middle" font-size="6" fill="#FF6B6B">NO subas trapecios</text>
        </svg>`;
    },

    drawBarbellCurl() {
        return `<svg viewBox="0 0 200 130" class="exercise-illust">
            <circle cx="100" cy="20" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="28" x2="100" y2="75" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="75" x2="90" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="75" x2="110" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="42" x2="85" y2="55" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="85" y1="55" x2="85" y2="42" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="42" x2="115" y2="55" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="115" y1="55" x2="115" y2="42" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="70" y1="40" x2="130" y2="40" stroke="#6C63FF" stroke-width="3"/>
            <circle cx="70" cy="40" r="4" fill="#6C63FF" opacity="0.6"/>
            <circle cx="130" cy="40" r="4" fill="#6C63FF" opacity="0.6"/>
            <text x="140" y="50" font-size="6" fill="#FF6B6B">Codos</text>
            <text x="140" y="58" font-size="6" fill="#FF6B6B">FIJOS</text>
            <path d="M 75 65 Q 75 35 85 30" stroke="#4ECDC4" stroke-width="1.2" fill="none"/>
            <text x="50" y="30" font-size="7" fill="#4ECDC4">↑ Curl</text>
        </svg>`;
    },

    drawTricepPushdown() {
        return `<svg viewBox="0 0 200 130" class="exercise-illust">
            <rect x="95" y="5" width="10" height="8" fill="#555"/>
            <line x1="100" y1="13" x2="100" y2="50" stroke="#555" stroke-width="1.5"/>
            <circle cx="100" cy="35" r="8" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="43" x2="100" y2="85" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="85" x2="90" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="85" x2="110" y2="120" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="90" y2="55" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="90" y1="55" x2="90" y2="80" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="110" y2="55" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="110" y1="55" x2="110" y2="80" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="85" y1="50" x2="85" y2="80" stroke="#6C63FF" stroke-width="2"/>
            <path d="M 75 60 L 75 80 L 70 75 M 75 80 L 80 75" stroke="#4ECDC4" stroke-width="1.5" fill="none"/>
            <text x="55" y="85" font-size="7" fill="#4ECDC4">BAJA</text>
            <text x="120" y="55" font-size="6" fill="#FF6B6B">Codos fijos</text>
        </svg>`;
    },

    drawGenericExercise(exerciseId) {
        const ex = EXERCISES_DB.find(e => e.id === exerciseId);
        const muscle = ex ? ex.muscle : '';
        const color = this.colors[muscle] || '#6C63FF';
        return `<svg viewBox="0 0 200 120" class="exercise-illust">
            <circle cx="100" cy="30" r="10" fill="none" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="40" x2="100" y2="80" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="80" x2="80" y2="110" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="80" x2="120" y2="110" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="70" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <line x1="100" y1="55" x2="130" y2="45" stroke="#B8B8D0" stroke-width="2"/>
            <circle cx="100" cy="65" r="12" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="1"/>
            <text x="100" y="69" text-anchor="middle" font-size="7" fill="${color}">${muscle}</text>
        </svg>`;
    },

    drawLegPress() { return this.drawGenericExercise('leg-press'); },
    drawRDL() { return this.drawGenericExercise('romanian-deadlift'); },
    drawHipThrust() { return this.drawGenericExercise('hip-thrust'); },
    drawHangingLegRaise() { return this.drawGenericExercise('hanging-leg-raise'); },
    drawCableFly() { return this.drawGenericExercise('cable-fly-low'); },
    drawFacePulls() { return this.drawGenericExercise('face-pulls'); },
    drawBarbellRow() { return this.drawGenericExercise('barbell-row'); },

    // ===== ACTIONS =====
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

    setView(view) { this.view = view; this.rerender(); },

    confirmSelection() {
        if (this.selectedMuscles.length > 0) {
            ExercisesPage.filterByMuscles(this.selectedMuscles);
        }
    },

    getExercisesForSelected() {
        if (this.selectedMuscles.length === 0) return [];
        return EXERCISES_DB.filter(ex => 
            this.selectedMuscles.includes(ex.muscle) || 
            (ex.secondary && ex.secondary.some(s => this.selectedMuscles.includes(s)))
        );
    },

    rerender() {
        const container = document.getElementById('body-map-wrapper');
        if (container) container.innerHTML = this.render({ selectable: this.selectableMode !== false });
    }
};
