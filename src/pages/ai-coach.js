// ===== AI COACH PAGE - Premium Symmetry-Inspired =====
const AICoachPage = {
    isLoading: false,

    render() {
        const chatHistory = Storage.getChatHistory();

        return `
        <div class="chat-container animate-fade">
            <div class="quick-actions">
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Que entreno hoy?')">Entreno de hoy</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Dame mi plan nutricional completo')">Nutricion</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Hazme una valoracion fisica completa')">Valoracion</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Como supero mi estancamiento actual?')">Plateau</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Creame una rutina nueva')">Nueva rutina</button>
                <button class="quick-action" onclick="AICoachPage.quickPrompt('Guia completa de suplementacion')">Suplementos</button>
            </div>

            <div class="chat-messages" id="chat-messages">
                ${chatHistory.length === 0 ? `
                    <div class="chat-bubble ai">
                        <div class="msg-content">
                            <p><strong>Coach IA</strong></p>
                            <p class="msg-secondary">Preguntame lo que quieras sobre entrenamiento, nutricion, suplementacion, lesiones, recuperacion o cualquier tema de fitness y salud. Tambien puedo analizar fotos de tu fisico.</p>
                        </div>
                    </div>
                ` : chatHistory.map(msg => `
                    <div class="chat-bubble ${msg.role}">
                        ${this.formatMessage(msg.content)}
                    </div>
                `).join('')}

                ${this.isLoading ? `
                    <div class="chat-bubble ai">
                        <div class="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                ` : ''}
            </div>

            <div class="chat-input-area">
                <button class="btn-photo" onclick="AICoachPage.uploadPhoto()" title="Enviar foto para analisis">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                </button>
                <input type="text" id="chat-input" placeholder="Pregunta lo que quieras..."
                    onkeypress="if(event.key==='Enter')AICoachPage.sendMessage()">
                <button class="btn-send" onclick="AICoachPage.sendMessage()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>

            <input type="file" id="photo-input" accept="image/*" capture="environment" style="display:none" onchange="AICoachPage.handlePhoto(event)">
        </div>`;
    },

    formatMessage(content) {
        let formatted = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>')
            .replace(/• /g, '&bull; ');
        return `<div class="msg-content">${formatted}</div>`;
    },

    async sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message || this.isLoading) return;

        Storage.addChatMessage({ role: 'user', content: message });
        input.value = '';

        this.isLoading = true;
        App.renderCurrentPage();
        this.scrollToBottom();

        const response = await AIEngine.generateResponse(message);

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

        const base64 = await Helpers.imageToBase64(file);
        Storage.addChatMessage({ role: 'user', content: '[Foto enviada para analisis]' });
        Storage.addPhoto({ data: base64, type: 'analysis' });

        this.isLoading = true;
        App.renderCurrentPage();
        this.scrollToBottom();

        const response = await AIEngine.analyzeImage(base64);

        Storage.addChatMessage({ role: 'ai', content: response });
        this.isLoading = false;
        App.renderCurrentPage();
        this.scrollToBottom();
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
