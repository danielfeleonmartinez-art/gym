// ===== SCAN PAGE - Escaneo Corporal Completo =====
const ScanPage = {
    scanResult: null,
    
    render() {
        const profile = Storage.getProfile();
        
        if (this.scanResult) {
            return this.renderResult(profile);
        }
        
        return `
        <div class="animate-fade">
            <div style="text-align: center; padding: 2rem 0;">
                <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem;">Escaneo Corporal</h2>
                <p style="color: var(--text-secondary); font-size: 0.85rem; max-width: 280px; margin: 0 auto;">
                    Toma una foto o sube una imagen para recibir tu valoración completa con plan personalizado.
                </p>
            </div>

            <!-- Scan Options -->
            <div style="display: flex; flex-direction: column; gap: 1rem; max-width: 320px; margin: 2rem auto;">
                <button class="btn btn-primary btn-lg btn-full" onclick="document.getElementById('scan-camera').click()">
                    Tomar Foto
                </button>
                <button class="btn btn-secondary btn-lg btn-full" onclick="document.getElementById('scan-upload').click()">
                    Subir Imagen
                </button>
            </div>
            
            <input type="file" id="scan-camera" accept="image/*" capture="environment" style="display:none" onchange="ScanPage.handleScan(event)">
            <input type="file" id="scan-upload" accept="image/*" style="display:none" onchange="ScanPage.handleScan(event)">

            <!-- Quick Access -->
            <div style="margin-top: 2rem;">
                <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; margin-bottom: 1rem;">Acceso rápido</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="card" style="padding: 1rem; cursor: pointer; text-align: center;" onclick="App.navigate('muscle-stats')">
                        <span style="font-size: 1.5rem;">📊</span>
                        <p style="font-size: 0.75rem; font-weight: 600; margin-top: 0.3rem;">Mis Stats</p>
                    </div>
                    <div class="card" style="padding: 1rem; cursor: pointer; text-align: center;" onclick="App.navigate('assessment')">
                        <span style="font-size: 1.5rem;">🎯</span>
                        <p style="font-size: 0.75rem; font-weight: 600; margin-top: 0.3rem;">Valoración</p>
                    </div>
                    <div class="card" style="padding: 1rem; cursor: pointer; text-align: center;" onclick="App.navigate('progress')">
                        <span style="font-size: 1.5rem;">📈</span>
                        <p style="font-size: 0.75rem; font-weight: 600; margin-top: 0.3rem;">Progreso</p>
                    </div>
                    <div class="card" style="padding: 1rem; cursor: pointer; text-align: center;" onclick="App.navigate('nutrition')">
                        <span style="font-size: 1.5rem;">🥗</span>
                        <p style="font-size: 0.75rem; font-weight: 600; margin-top: 0.3rem;">Nutrición</p>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderResult(profile) {
        const result = this.scanResult;
        return `
        <div class="animate-fade">
            <button class="btn btn-secondary btn-sm mb-3" onclick="ScanPage.scanResult=null; App.renderCurrentPage();">
                Nuevo escaneo
            </button>
            
            <div class="card mb-3" style="text-align: center; border-color: ${result.color};">
                <p style="font-size: 2.5rem; font-weight: 900; color: ${result.color};">${result.score}/100</p>
                <p style="font-size: 1rem; font-weight: 700;">${result.state}</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;">~${result.bodyFat}% grasa corporal</p>
            </div>

            <div class="card mb-2">
                <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Análisis</h3>
                <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.7;">
                    ${result.analysis}
                </div>
            </div>

            <div class="card mb-2">
                <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Plan de Acción</h3>
                <ul style="list-style: none; padding: 0;">
                    ${result.actions.map(a => '<li style="padding: 0.4rem 0; font-size: 0.82rem; color: var(--text-secondary); border-bottom: 1px solid var(--border);">' + a + '</li>').join('')}
                </ul>
            </div>

            <div class="card mb-2">
                <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">Objetivos</h3>
                <div style="font-size: 0.82rem; color: var(--text-secondary);">
                    <p>4 semanas: <strong>${result.target4w}kg</strong></p>
                    <p>12 semanas: <strong>${result.target12w}kg</strong></p>
                    <p>Calorías: <strong>${result.calories} kcal/día</strong></p>
                    <p>Proteína: <strong>${result.protein}g/día</strong></p>
                </div>
            </div>

            <button class="btn btn-primary btn-full" onclick="ScanPage.generateFullPlan()">
                Generar rutina + nutrición completa
            </button>
        </div>`;
    },

    async handleScan(event) {
        const file = event.target.files[0];
        if (!file) return;

        const base64 = await Helpers.imageToBase64(file);
        Storage.addPhoto({ data: base64, type: 'scan' });

        const profile = Storage.getProfile();
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const age = profile.age || 25;
        const gender = profile.gender || 'hombre';
        const bmi = weight / ((height/100)**2);
        
        let estimatedBF;
        if (gender === 'hombre') estimatedBF = (1.20 * bmi) + (0.23 * age) - 16.2;
        else estimatedBF = (1.20 * bmi) + (0.23 * age) - 5.4;
        estimatedBF = Math.max(5, Math.min(45, estimatedBF)).toFixed(1);

        let state, color, score;
        if (estimatedBF < 12) { state = 'Definido'; color = 'var(--success)'; score = 90; }
        else if (estimatedBF < 16) { state = 'Atlético'; color = 'var(--primary)'; score = 75; }
        else if (estimatedBF < 20) { state = 'En forma'; color = 'var(--accent)'; score = 60; }
        else if (estimatedBF < 25) { state = 'Promedio'; color = 'var(--warning)'; score = 45; }
        else { state = 'Necesita trabajo'; color = 'var(--danger)'; score = 30; }

        const isLosing = (profile.goal || '').includes('perder') || bmi > 25;
        const calories = isLosing ? Math.round(weight * 24) : Math.round(weight * 34);
        const protein = Math.round(weight * 2.2);

        this.scanResult = {
            bodyFat: estimatedBF,
            state, color, score,
            analysis: this.generateAnalysis(estimatedBF, bmi, gender, profile),
            actions: this.generateActions(estimatedBF, profile),
            target4w: isLosing ? (weight - 2.5).toFixed(1) : (weight + 1.5).toFixed(1),
            target12w: isLosing ? (weight - 7).toFixed(1) : (weight + 4).toFixed(1),
            calories, protein
        };

        event.target.value = '';
        App.renderCurrentPage();
    },

    generateAnalysis(bf, bmi, gender, profile) {
        let text = '';
        if (bf > 20) text += 'Hay una capa de grasa cubriendo la musculatura. ';
        if (bf > 25) text += 'La acumulación es notable especialmente en abdomen' + (gender === 'hombre' ? ' y cintura.' : ' y caderas.');
        if (bf < 16) text += 'Buen nivel de definición. Se nota la separación muscular. ';
        if (bf < 12) text += 'Excelente definición. Abdominales visibles y vascularidad. ';
        
        const workouts = Storage.getWorkoutHistory().length;
        if (workouts < 10) text += ' Con poca actividad registrada, el potencial de mejora es muy alto.';
        else if (workouts > 20) text += ' Tu consistencia es buena - los resultados vendrán si la nutrición acompaña.';
        
        return text || 'Estado aceptable con margen de mejora. La consistencia en entrenamiento y nutrición definirá tu transformación.';
    },

    generateActions(bf, profile) {
        const weight = profile.weight || 70;
        const actions = [];
        
        if (bf > 20) {
            actions.push('Déficit calórico de ' + Math.round(weight * 24) + ' kcal/día');
            actions.push('Proteína alta: ' + Math.round(weight * 2.2) + 'g diarios');
            actions.push('Cardio LISS 3-4x semana, 20-30min');
            actions.push('Entrenamiento de fuerza ' + (profile.daysPerWeek || 4) + 'x semana');
            actions.push('Dormir 7-9 horas cada noche');
        } else {
            actions.push('Superávit controlado: ' + Math.round(weight * 34) + ' kcal/día');
            actions.push('Proteína: ' + Math.round(weight * 2) + 'g diarios');
            actions.push('Progresión de cargas semanal (+2.5kg compuestos)');
            actions.push('Entrenamiento ' + (profile.daysPerWeek || 4) + 'x semana con periodización');
            actions.push('Priorizar músculos débiles para proporción');
        }
        return actions;
    },

    generateFullPlan() {
        const profile = Storage.getProfile();
        const routine = AIEngine.generateCustomRoutine(profile);
        routine.name = 'Plan Post-Escaneo';
        routine.description = 'Generado tras escaneo corporal - ' + (this.scanResult ? this.scanResult.state : '');
        Storage.saveRoutine(routine);
        Helpers.showToast('Plan completo generado en Rutinas');
        App.navigate('routines');
    }
};
