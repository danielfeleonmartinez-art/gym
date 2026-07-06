// ===== SCAN PAGE - Symmetry-Style Body Analysis =====
const ScanPage = {
    scanResult: null,
    selectedMuscles: [],

    render() {
        if (this.scanResult) return this.renderResult();
        return this.renderScan();
    },

    renderScan() {
        const profile = Storage.getProfile();
        return `
        <div class="animate-fade">
            <div style="text-align:center;padding:1.5rem 0;">
                <h2 style="font-size:1.3rem;font-weight:800;letter-spacing:-0.03em">Body Scan</h2>
                <p style="color:var(--text-muted);font-size:0.78rem;max-width:280px;margin:0.3rem auto 0">Analisis completo de tu fisico con puntuacion Overall, ranking por musculo y plan personalizado.</p>
            </div>

            <div style="display:flex;flex-direction:column;gap:0.75rem;max-width:320px;margin:1.5rem auto;">
                <button class="btn btn-primary btn-lg btn-full" onclick="document.getElementById('scan-camera').click()">Tomar Foto</button>
                <button class="btn btn-secondary btn-lg btn-full" onclick="document.getElementById('scan-upload').click()">Subir Imagen</button>
                <button class="btn btn-ghost btn-lg btn-full" onclick="ScanPage.quickScan()">Scan rapido (sin foto)</button>
            </div>

            <input type="file" id="scan-camera" accept="image/*" capture="environment" style="display:none" onchange="ScanPage.handleScan(event)">
            <input type="file" id="scan-upload" accept="image/*" style="display:none" onchange="ScanPage.handleScan(event)">

            <!-- Muscle Interest Selection -->
            <div style="margin-top:2rem;">
                <h3 style="font-size:0.88rem;font-weight:700;margin-bottom:0.6rem">Musculos prioritarios</h3>
                <p style="font-size:0.7rem;color:var(--text-muted);margin-bottom:0.75rem">Selecciona los musculos que quieres priorizar en tu entrenamiento</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                    ${['Pecho','Espalda','Hombros','Biceps','Triceps','Piernas','Gluteos','Core','Trapecios','Antebrazos'].map(m => `
                        <button class="tag ${this.selectedMuscles.includes(m)?'active':''}" onclick="ScanPage.toggleMuscle('${m}')">${m}</button>
                    `).join('')}
                </div>
                ${this.selectedMuscles.length > 0 ? `<button class="btn btn-primary btn-sm mt-2" onclick="ScanPage.saveMusclePrefs()">Guardar prioridades</button>` : ''}
            </div>

            <!-- Quick Stats -->
            <div style="margin-top:1.5rem;">
                <h3 style="font-size:0.88rem;font-weight:700;margin-bottom:0.6rem">Tu estado actual</h3>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-value">${profile.weight||'--'}kg</div>
                        <div class="stat-label">Peso</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${profile.weight&&profile.height?(profile.weight/((profile.height/100)**2)).toFixed(1):'--'}</div>
                        <div class="stat-label">IMC</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Storage.getWorkoutHistory().length}</div>
                        <div class="stat-label">Sesiones</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${Object.keys(Storage.getPRs()).length}</div>
                        <div class="stat-label">PRs</div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderResult() {
        const r = this.scanResult;
        return `
        <div class="animate-fade">
            <button class="btn btn-ghost btn-sm mb-3" onclick="ScanPage.scanResult=null;App.renderCurrentPage();">Nuevo scan</button>

            <!-- Overall Score -->
            <div class="overall-card" style="margin-bottom:1rem">
                <div class="overall-score-container">
                    <div class="overall-ring" style="--progress:${r.overall}">
                        <div class="overall-number">${r.overall}</div>
                    </div>
                    <div class="overall-info">
                        <div class="overall-rank">${r.rank}</div>
                        <div class="overall-label">Overall Rating</div>
                        <div class="overall-sublabel">~${r.bodyFat}% grasa corporal</div>
                    </div>
                </div>
                <div class="overall-stats">
                    <div class="os-item"><span class="os-value">${r.strength}</span><span class="os-label">Fuerza</span></div>
                    <div class="os-item"><span class="os-value">${r.symmetry}</span><span class="os-label">Simetria</span></div>
                    <div class="os-item"><span class="os-value">${r.conditioning}</span><span class="os-label">Condicion</span></div>
                    <div class="os-item"><span class="os-value">${r.consistency}</span><span class="os-label">Consistencia</span></div>
                </div>
            </div>

            <!-- Muscle Ratings -->
            <h3 style="font-size:0.88rem;font-weight:700;margin-bottom:0.5rem">Rating por musculo</h3>
            <div class="muscle-ranks-grid" style="margin-bottom:1rem">
                ${r.muscleRatings.map(m => `
                    <div class="muscle-rank-card">
                        <div class="mr-header">
                            <span class="mr-name">${m.name}</span>
                            <span class="mr-score ${m.tier}">${m.score}</span>
                        </div>
                        <div class="mr-bar"><div class="mr-bar-fill" style="width:${m.score}%;background:${m.color}"></div></div>
                        <div class="mr-tier">${m.tierLabel}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Analysis -->
            <div class="card" style="margin-bottom:0.75rem">
                <h3 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem">Analisis</h3>
                <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.7">${r.analysis}</div>
            </div>

            <!-- Plan -->
            <div class="card" style="margin-bottom:0.75rem">
                <h3 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem">Plan de Accion</h3>
                <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.8">
                    ${r.plan.map(p => '- ' + p).join('<br>')}
                </div>
            </div>

            <!-- Targets -->
            <div class="card" style="margin-bottom:0.75rem">
                <h3 style="font-size:0.85rem;font-weight:700;margin-bottom:0.5rem">Objetivos</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.78rem;color:var(--text-secondary)">
                    <div>4 semanas: <strong>${r.target4w}kg</strong></div>
                    <div>12 semanas: <strong>${r.target12w}kg</strong></div>
                    <div>Calorias: <strong>${r.calories} kcal</strong></div>
                    <div>Proteina: <strong>${r.protein}g/dia</strong></div>
                </div>
            </div>

            <button class="btn btn-primary btn-full" onclick="ScanPage.generatePlanWithAI()">Generar plan con IA</button>
            <button class="btn btn-secondary btn-full mt-1" onclick="ScanPage.generatePlan()">Generar rutina rapida</button>
        </div>`;
    },

    toggleMuscle(muscle) {
        const idx = this.selectedMuscles.indexOf(muscle);
        if (idx >= 0) this.selectedMuscles.splice(idx, 1);
        else this.selectedMuscles.push(muscle);
        App.renderCurrentPage();
    },

    saveMusclePrefs() {
        const prefs = Storage.getUserPreferences();
        prefs.focusMuscles = this.selectedMuscles.join(', ');
        Storage.setUserPreferences(prefs);
        Helpers.showToast('Prioridades guardadas');
    },

    quickScan() {
        this.runScan();
    },

    async handleScan(event) {
        const file = event.target.files[0];
        if (!file) return;
        const base64 = await Helpers.imageToBase64(file);
        Storage.addPhoto({ data: base64, type: 'scan' });
        event.target.value = '';
        this.runScan();
    },

    runScan() {
        const profile = Storage.getProfile();
        const w = profile.weight||70, h = profile.height||175, a = profile.age||25, g = profile.gender||'hombre';
        const bmi = w/((h/100)**2);
        const prs = Storage.getPRs();
        const workouts = Storage.getWorkoutHistory();
        const week = Storage.getCurrentWeek();
        const expected = week * (profile.daysPerWeek||4);

        // Body fat estimation
        let bf = g==='mujer' ? (1.2*bmi+0.23*a-5.4) : (1.2*bmi+0.23*a-16.2);
        bf = Math.max(5, Math.min(45, bf)).toFixed(0);

        // Strength score
        const bench = prs['bench-press']?prs['bench-press'].weight/w:0;
        const squat = prs['squat']?prs['squat'].weight/w:0;
        const dead = prs['deadlift']?prs['deadlift'].weight/w:0;
        const avgStr = (bench+squat+dead)/3;
        let strengthScore = avgStr>2?95:avgStr>1.5?82:avgStr>1.2?70:avgStr>0.9?58:avgStr>0.5?42:25;

        // Consistency
        const consistency = expected>0 ? Math.min(99, Math.round(workouts.length/expected*100)) : 20;

        // Conditioning (based on bf%)
        let conditioning = bf<12?92:bf<16?78:bf<20?62:bf<25?45:30;

        // Symmetry (based on PR balance)
        let symmetry = 65;
        if (bench>0&&squat>0&&dead>0) {
            const ratio = Math.min(bench,squat,dead)/Math.max(bench,squat,dead);
            symmetry = Math.round(ratio * 95);
        }

        // Overall
        const overall = Math.round(strengthScore*0.35 + conditioning*0.25 + consistency*0.2 + symmetry*0.2);

        // Rank
        let rank = overall>=90?'ELITE':overall>=75?'AVANZADO':overall>=60?'INTERMEDIO':overall>=40?'PRINCIPIANTE':'NOVATO';

        // Muscle ratings
        const muscleGroups = [
            {name:'Pecho',ids:['bench-press','incline-bench','dumbbell-fly'],color:'#EF4444'},
            {name:'Espalda',ids:['pull-ups','barbell-row','lat-pulldown','deadlift'],color:'#3B82F6'},
            {name:'Hombros',ids:['ohp','lateral-raise'],color:'#F59E0B'},
            {name:'Piernas',ids:['squat','leg-press','romanian-deadlift'],color:'#8B5CF6'},
            {name:'Biceps',ids:['barbell-curl','incline-curl','hammer-curl'],color:'#EC4899'},
            {name:'Triceps',ids:['close-grip-bench','overhead-extension','tricep-pushdown'],color:'#06B6D4'},
            {name:'Core',ids:['hanging-leg-raise','cable-crunch'],color:'#22C55E'}
        ];

        const muscleRatings = muscleGroups.map(group => {
            const scores = group.ids.map(id => prs[id]?prs[id].weight/w:0).filter(v=>v>0);
            let score = scores.length===0 ? 20 : Math.min(99, Math.round((scores.reduce((a,b)=>a+b,0)/scores.length)*60+20));
            let tier,tierLabel;
            if(score>=85){tier='elite';tierLabel='Elite';}
            else if(score>=70){tier='advanced';tierLabel='Avanzado';}
            else if(score>=55){tier='intermediate';tierLabel='Intermedio';}
            else if(score>=35){tier='beginner';tierLabel='Principiante';}
            else{tier='novice';tierLabel='Novato';}
            return {...group, score, tier, tierLabel};
        }).sort((a,b)=>b.score-a.score);

        // Analysis
        const losing = (profile.goal||'').includes('perder') || bmi > 25;
        let analysis = bf>20 ? 'Capa de grasa cubriendo la musculatura. La definicion no es visible. ' : bf>15 ? 'Estado atletico con algo de grasa residual. ' : 'Buena definicion muscular. ';
        if (workouts.length < 10) analysis += 'Poca actividad registrada - el potencial de mejora es alto.';
        else if (workouts.length > 30) analysis += 'Buena consistencia de entrenamiento.';
        const weakMuscles = muscleRatings.filter(m=>m.score<50);
        if (weakMuscles.length>0) analysis += ' Musculos debiles: ' + weakMuscles.map(m=>m.name).join(', ') + '.';

        // Plan
        const calories = losing ? Math.round(w*24) : Math.round(w*34);
        const protein = Math.round(w*2.2);
        const plan = losing ? [
            'Deficit calorico: ' + calories + ' kcal/dia',
            'Proteina alta: ' + protein + 'g/dia',
            'Entreno fuerza ' + (profile.daysPerWeek||4) + 'x/semana (preservar musculo)',
            'Cardio LISS 3-4x/semana 20-30min',
            '10.000 pasos diarios',
            'Dormir 7-9h'
        ] : [
            'Superavit controlado: ' + calories + ' kcal/dia',
            'Proteina: ' + protein + 'g/dia',
            'Progresion de cargas semanal (+2.5kg compuestos)',
            'Entreno ' + (profile.daysPerWeek||4) + 'x/semana con periodizacion',
            'Priorizar: ' + (weakMuscles.length>0?weakMuscles.map(m=>m.name).join(', '):'musculos rezagados'),
            'Dormir 7-9h para maximizar recuperacion'
        ];

        this.scanResult = {
            overall, rank, bodyFat: bf,
            strength: strengthScore, symmetry, conditioning, consistency,
            muscleRatings, analysis, plan,
            target4w: losing?(w-2.5).toFixed(1):(w+1.5).toFixed(1),
            target12w: losing?(w-7).toFixed(1):(w+4).toFixed(1),
            calories, protein
        };

        App.renderCurrentPage();
    },

    async generatePlanWithAI() {
        const d = AIEngine.getUserData();
        const weakMuscles = this.scanResult ? this.scanResult.muscleRatings.filter(m => m.score < 55).map(m => m.name) : [];
        const prompt = `Basandote en este perfil: ${d.w}kg, ${d.h}cm, ${d.a} anos, IMC ${d.bmi}, grasa ~${this.scanResult?this.scanResult.bodyFat:'20'}%, nivel ${d.p.level||'intermedio'}, objetivo ${d.p.goal||'ganar musculo'}, musculos debiles: ${weakMuscles.join(', ')||'ninguno identificado'}. Dame un plan de 4 semanas con: 1) Los 5 mejores ejercicios especificos para los musculos debiles con series, reps y peso sugerido basado en ${d.w}kg de peso corporal. 2) Nutricion diaria con calorias y macros. 3) Cardio recomendado. Se muy especifico con nombres de ejercicios reales.`;

        // Try AI response (will use local AI if no API key)
        try {
            const result = await AIEngine.generateResponse(prompt);
            if (result) {
                Storage.addChatMessage({ role: 'user', content: 'Genera un plan basado en mi scan corporal' });
                Storage.addChatMessage({ role: 'ai', content: result });
                App.navigate('ai-coach');
                return;
            }
        } catch(e) {
            console.error('Plan generation error:', e);
        }

        // Fallback: generate routine directly
        this.generatePlan();
    },

    generatePlan() {
        const profile = Storage.getProfile();
        const routine = AIEngine.generateCustomRoutine(profile);
        routine.name = 'Plan Post-Scan';
        if (this.scanResult) {
            const weakMuscles = this.scanResult.muscleRatings.filter(m => m.score < 55).map(m => m.name);
            routine.description = weakMuscles.length > 0 
                ? `Enfocado en: ${weakMuscles.join(', ')}`
                : 'Rutina equilibrada basada en tu scan';
        }
        Storage.saveRoutine(routine);
        Helpers.showToast('Rutina generada desde tu scan!');
        App.navigate('routines');
    }
};
