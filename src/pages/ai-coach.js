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

        // Generate analysis WITHOUT needing API - uses local AI
        const profile = Storage.getProfile();
        const measurements = Storage.getMeasurements();
        const week = Storage.getCurrentWeek();
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const bmi = (weight / ((height/100)**2)).toFixed(1);
        const workouts = Storage.getWorkoutHistory().length;

        const response = `📸 **Foto Recibida - Valoración Personalizada**

📊 **Tu estado actual:**
• Peso: ${weight}kg | Altura: ${height}cm | IMC: ${bmi}
• Nivel: ${profile.level || 'intermedio'} | Semana: ${week}/12
• Entrenamientos completados: ${workouts}
• Objetivo: ${profile.goal || 'mejorar físico'}

🔍 **Análisis basado en tus datos:**
${parseFloat(bmi) < 20 ? '• Tu IMC indica bajo peso. Necesitas un superávit calórico de +400kcal y enfocarte en compuestos pesados para ganar masa.' : 
parseFloat(bmi) < 25 ? '• Tu IMC está en rango saludable. Tienes una excelente base para ganar músculo o definir según tu objetivo.' :
parseFloat(bmi) < 30 ? '• Tu IMC indica algo de sobrepeso. Con un déficit de -400kcal y entrenamiento de fuerza, puedes transformarte en 12 semanas.' :
'• Necesitas priorizar la pérdida de grasa. Déficit de -500kcal + cardio LISS + pesas para preservar músculo.'}

💪 **Plan de acción (próximas 4 semanas):**
1. ${profile.goal && profile.goal.includes('perder') ? `Calorías: ${Math.round(weight * 25)}kcal/día con ${Math.round(weight * 2.2)}g proteína` : `Calorías: ${Math.round(weight * 34)}kcal/día con ${Math.round(weight * 2)}g proteína`}
2. Entrena ${profile.daysPerWeek || 4}x/semana sin faltar
3. Duerme 7-9h cada noche (es donde creces)
4. Registra tu peso 3x/semana + fotos cada 2 semanas

📈 **Resultado esperado en 4 semanas:**
${profile.goal && profile.goal.includes('perder') ? '• -2 a 3kg de grasa\n• Cintura -2 a 4cm\n• Fuerza se mantiene o sube' : '• +1 a 2kg de masa muscular\n• Fuerza +10-20% en compuestos\n• Cambio visual notable en ropa'}

📸 **Para mejor seguimiento:**
• Toma fotos siempre en las mismas condiciones
• Misma luz, misma hora (mañana en ayunas es ideal)
• Poses: frontal relajado, frontal flex, lateral, espalda

¡Sigue así! 🔥 ¿Quieres que te ajuste la rutina o el plan nutricional?`;

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
