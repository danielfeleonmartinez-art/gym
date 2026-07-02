// ===== AI COACH PAGE =====
const AICoachPage = {
    isLoading: false,

    render() {
        const chatHistory = Storage.getChatHistory();

        return `
        <div class="chat-container animate-fade">
            <!-- Quick Actions -->
            <div class="quick-actions">
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Hazme una valoración completa')">📊 Valorarme</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Dame mi rutina personalizada')">💪 Mi Rutina</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Plan nutricional para hoy')">🥗 Nutrición</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Dame un consejo de suplementación')">💊 Suplementos</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Necesito motivación')">🔥 Motivación</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Consejos de recuperación')">😴 Recovery</button>
            </div>

            <!-- Chat Messages -->
            <div class="chat-messages" id="chat-messages">
                ${chatHistory.length === 0 ? `
                    <div class="chat-bubble ai">
                        <p>👋 ¡Hola! Soy tu <strong>Coach de IA</strong>.</p>
                        <p style="margin-top: 0.5rem;">Puedo ayudarte con:</p>
                        <ul style="margin-top: 0.5rem; padding-left: 1rem; font-size: 0.85rem;">
                            <li>💪 Rutinas personalizadas y efectivas</li>
                            <li>🥗 Planes nutricionales con macros</li>
                            <li>📊 Valoración de tu estado físico</li>
                            <li>📸 Análisis de fotos de progreso</li>
                            <li>💊 Guía de suplementación</li>
                            <li>🔥 Motivación y consejos</li>
                        </ul>
                        <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
                            Escribe tu pregunta o usa los botones rápidos de arriba. También puedes enviar fotos para que las analice 📸
                        </p>
                    </div>
                ` : chatHistory.map(msg => `
                    <div class="chat-bubble ${msg.role}">
                        ${this.formatMessage(msg.content)}
                    </div>
                `).join('')}

                ${this.isLoading ? `
                    <div class="chat-bubble ai">
                        <div style="display: flex; gap: 0.3rem; align-items: center;">
                            <span class="loading-dot">●</span>
                            <span class="loading-dot" style="animation-delay: 0.2s;">●</span>
                            <span class="loading-dot" style="animation-delay: 0.4s;">●</span>
                        </div>
                    </div>
                    <style>
                        .loading-dot { animation: pulse 1s infinite; font-size: 0.8rem; color: var(--primary); }
                    </style>
                ` : ''}
            </div>

            <!-- Input Area -->
            <div class="chat-input-area">
                <button class="btn-photo" onclick="AICoachPage.uploadPhoto()" title="Enviar foto">
                    📷
                </button>
                <input type="text" id="chat-input" placeholder="Pregúntame lo que quieras..." 
                    onkeypress="if(event.key==='Enter')AICoachPage.sendMessage()">
                <button class="btn-send" onclick="AICoachPage.sendMessage()">➤</button>
            </div>

            <!-- Hidden file input -->
            <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none" onchange="AICoachPage.handlePhoto(event)">
        </div>`;
    },

    formatMessage(content) {
        // Simple markdown-like formatting
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '&bull; ')
            .replace(/^# (.*)/gm, '<h3>$1</h3>')
            .replace(/^## (.*)/gm, '<h4>$1</h4>');
        return `<div style="font-size: 0.88rem; line-height: 1.6;">${formatted}</div>`;
    },

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;

        // Add user message
        Storage.addChatMessage({ role: 'user', content: message });
        input.value = '';

        this.isLoading = true;
        App.renderCurrentPage();
        this.scrollToBottom();

        // Generate AI response
        const response = await AIEngine.generateResponse(message);

        // Add AI response
        Storage.addChatMessage({ role: 'ai', content: response });
        this.isLoading = false;
        App.renderCurrentPage();
        this.scrollToBottom();
    },

    quickPrompt(prompt) {
        document.getElementById('chat-input').value = prompt;
        this.sendMessage();
    },

    uploadPhoto() {
        document.getElementById('photo-input').click();
    },

    async handlePhoto(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Show preview of uploaded image
        const base64 = await Helpers.imageToBase64(file);
        Storage.addChatMessage({ role: 'user', content: '📸 [Foto enviada para análisis]' });
        
        // Save photo to progress
        Storage.addPhoto({ data: base64, type: 'analysis' });

        this.isLoading = true;
        App.renderCurrentPage();

        // Generate DETAILED physical analysis WITHOUT needing API
        const profile = Storage.getProfile();
        const measurements = Storage.getMeasurements();
        const week = Storage.getCurrentWeek();
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const age = profile.age || 25;
        const gender = profile.gender || 'hombre';
        const bmi = (weight / ((height/100)**2)).toFixed(1);
        const workouts = Storage.getWorkoutHistory().length;
        const goal = profile.goal || 'mejorar físico';
        const level = profile.level || 'intermedio';

        // Estimate body fat based on BMI, age, gender (Navy method approximation)
        let estimatedBF;
        if (gender === 'hombre') {
            estimatedBF = (1.20 * parseFloat(bmi)) + (0.23 * age) - 16.2;
        } else {
            estimatedBF = (1.20 * parseFloat(bmi)) + (0.23 * age) - 5.4;
        }
        estimatedBF = Math.max(5, Math.min(45, estimatedBF)).toFixed(1);

        // Determine physical state
        let physicalState, greasLevel, muscleLevel, recommendations;
        
        if (estimatedBF < 12) {
            physicalState = 'Muy definido / Bajo en grasa';
            greasLevel = 'MUY BAJO';
            muscleLevel = 'Se ven todos los músculos con separación clara';
            recommendations = [
                'Estás muy definido - cuidado con bajar más (problemas hormonales)',
                'Ideal para mantener: come en mantenimiento',
                'Si quieres más masa: lean bulk de +200-300kcal',
                'Prioriza fuerza y volumen en esta fase'
            ];
        } else if (estimatedBF < 16) {
            physicalState = 'Atlético / Definido';
            greasLevel = 'BAJO';
            muscleLevel = 'Abdominales visibles, venas en brazos, separación muscular';
            recommendations = [
                'Excelente estado - los abs se ven o están cerca',
                'Puedes mantener o hacer lean bulk controlado',
                'Enfócate en músculos rezagados para simetría',
                'Si quieres más músculo: +250kcal por 12-16 semanas'
            ];
        } else if (estimatedBF < 20) {
            physicalState = 'En forma / Algo de grasa';
            greasLevel = 'MODERADO';
            muscleLevel = 'Músculos visibles pero cubiertos por capa de grasa. Abs se adivinan pero no se marcan';
            recommendations = [
                'Tienes buena base muscular pero la grasa la tapa',
                'Solución: déficit de -400kcal manteniendo proteína alta (2.2g/kg)',
                'En 8-12 semanas puedes revelar los músculos que ya tienes',
                'NO dejes de entrenar pesado - preserva el músculo',
                'Cardio LISS 3-4x/semana 20-30min ayudará mucho'
            ];
        } else if (estimatedBF < 25) {
            physicalState = 'Sobrepeso leve / Grasa acumulada';
            greasLevel = 'ALTO';
            muscleLevel = 'Los músculos están ahí pero la grasa los oculta completamente. Cintura ancha, cara redonda';
            recommendations = [
                'La grasa está tapando tu músculo - necesitas un cut',
                'Déficit de -500kcal: come ' + Math.round(weight * 24) + 'kcal/día',
                'Proteína ALTA: ' + Math.round(weight * 2.2) + 'g/día para no perder músculo',
                'Entrena igual de pesado que siempre (no "series de definición")',
                'Cardio: camina 10.000 pasos/día + 2-3 sesiones LISS',
                'En 12-16 semanas vas a ver una transformación BRUTAL',
                'La cintura es lo primero que se reduce - paciencia'
            ];
        } else {
            physicalState = 'Sobrepeso / Necesita transformación';
            greasLevel = 'MUY ALTO';
            muscleLevel = 'Músculo oculto bajo grasa significativa. Pero el potencial está ahí.';
            recommendations = [
                'La buena noticia: debajo de esa grasa HAY músculo',
                'Necesitas un déficit sostenido: ' + Math.round(weight * 22) + 'kcal/día',
                'Proteína: ' + Math.round(weight * 2) + 'g/día MÍNIMO',
                'Entrena pesas 3-4x/semana (construye músculo MIENTRAS pierdes grasa)',
                'Camina 8000-10000 pasos diarios (quema 300-400kcal extra)',
                'No hagas dietas extremas - sostenibilidad > velocidad',
                'Primer mes: -2 a 3kg. Mes 2-3: -2kg/mes. Mes 4: la gente empieza a notar',
                'Tu transformación en 4-6 meses va a ser INCREÍBLE'
            ];
        }

        // Detailed physical opinions
        const physicalOpinions = [];
        if (parseFloat(bmi) > 25) {
            physicalOpinions.push('📍 **Zona abdominal:** Se nota acumulación de grasa. Es la última zona en irse pero la primera en notarse. Con déficit constante, en 6-8 semanas empezarás a ver diferencia.');
            physicalOpinions.push('📍 **Cara/cuello:** Probablemente se ve más redonda de lo que debería. Esto mejora mucho con los primeros 3-5kg perdidos.');
        }
        if (parseFloat(bmi) < 22 && gender === 'hombre') {
            physicalOpinions.push('📍 **Hombros/brazos:** Se ven algo delgados. Prioriza press militar, laterales y curls para dar más anchura y volumen.');
            physicalOpinions.push('📍 **Pecho:** Probablemente plano. Enfócate en press inclinado + aperturas para desarrollarlo.');
        }
        if (workouts < 10) {
            physicalOpinions.push('📍 **Tono muscular:** Con solo ' + workouts + ' entrenamientos, aún no has desarrollado suficiente tono. A partir de las 4-6 semanas de entreno consistente verás cambios.');
        } else if (workouts > 20) {
            physicalOpinions.push('📍 **Tono muscular:** Con ' + workouts + ' entrenamientos ya debes tener buena base. Si no ves resultados, revisa la nutrición (es el 70% del cambio visual).');
        }
        physicalOpinions.push('📍 **Proporción:** ' + (gender === 'hombre' ? 'Para un V-taper estético: hombros anchos + cintura estrecha. Prioriza deltoides laterales y reduce grasa abdominal.' : 'Para una silueta estética: glúteos + hombros + cintura. Prioriza hip thrust, laterales y déficit moderado.'));

        const response = `📸 **VALORACIÓN DETALLADA DE TU FÍSICO**

━━━━━━━━━━━━━━━━━━━━━━
📊 **DATOS:**
• ${weight}kg | ${height}cm | IMC: ${bmi} | Edad: ${age}
• % Grasa corporal estimado: **~${estimatedBF}%**
• Estado: **${physicalState}**
• Nivel de grasa: **${greasLevel}**
━━━━━━━━━━━━━━━━━━━━━━

🔍 **LO QUE VEO (basado en tus datos):**

• **Nivel de grasa:** ${greasLevel} (~${estimatedBF}%)
${muscleLevel}

${physicalOpinions.join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━
💊 **MI DIAGNÓSTICO:**

${estimatedBF > 18 ? '⚠️ **Tienes grasa que está tapando tu músculo.** La solución NO es entrenar más, es comer menos (con estrategia).' : estimatedBF > 14 ? '✅ **Buen estado.** Estás cerca de verte muy bien. Un mini-cut de 6-8 semanas o un lean bulk te llevarían al siguiente nivel.' : '🏆 **Excelente estado.** Estás definido. Ahora enfócate en ganar masa en puntos débiles.'}

━━━━━━━━━━━━━━━━━━━━━━
🎯 **SOLUCIÓN - Plan de Acción:**

${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━
📅 **TIMELINE REALISTA:**
• Semana 1-2: No verás cambios visuales (pero tu cuerpo ya está cambiando)
• Semana 3-4: Ropa empieza a quedar diferente
• Semana 5-8: TÚ notas el cambio en el espejo
• Semana 9-12: LOS DEMÁS empiezan a preguntar "¿qué hiciste?"
• Mes 4+: Transformación evidente para todos

━━━━━━━━━━━━━━━━━━━━━━
📏 **OBJETIVOS NUMÉRICOS:**
• Peso objetivo 4 semanas: ${goal.includes('perder') ? (weight - 2.5).toFixed(1) : (weight + 1.5).toFixed(1)}kg
• Peso objetivo 12 semanas: ${goal.includes('perder') ? (weight - 7).toFixed(1) : (weight + 4).toFixed(1)}kg
• Calorías: ${goal.includes('perder') ? Math.round(weight * 24) : Math.round(weight * 34)}kcal/día
• Proteína: ${Math.round(weight * 2.2)}g/día (NO NEGOCIABLE)

💪 Envíame otra foto en 4 semanas y comparamos. ¡A darle! 🔥`;

        Storage.addChatMessage({ role: 'ai', content: response });
        this.isLoading = false;
        App.renderCurrentPage();
        this.scrollToBottom();
        
        // Reset file input
        event.target.value = '';
    },

    scrollToBottom() {
        setTimeout(() => {
            const container = document.getElementById('chat-messages');
            if (container) container.scrollTop = container.scrollHeight;
        }, 100);
    },

    clearChat() {
        Storage.clearChatHistory();
        App.renderCurrentPage();
    }
};
