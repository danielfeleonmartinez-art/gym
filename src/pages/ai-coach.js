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

        Storage.addChatMessage({ role: 'user', content: '📸 [Foto enviada para análisis]' });
        this.isLoading = true;
        App.renderCurrentPage();

        try {
            const base64 = await Helpers.imageToBase64(file);

            // Save photo to progress
            Storage.addPhoto({ data: base64, type: 'analysis' });

            const response = await AIEngine.analyzeImage(base64);
            Storage.addChatMessage({ role: 'ai', content: response });
        } catch (error) {
            Storage.addChatMessage({ role: 'ai', content: '❌ Error al procesar la imagen. Intenta con otra foto.' });
        }

        this.isLoading = false;
        App.renderCurrentPage();
        this.scrollToBottom();
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
