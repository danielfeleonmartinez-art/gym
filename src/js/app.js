// ===== MAIN APP =====
const App = {
    currentPage: 'dashboard',

    init() {
        // Show loading then reveal app
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');

                // Check if first time
                if (!Storage.isOnboarded()) {
                    this.showOnboarding();
                } else {
                    this.renderCurrentPage();
                }
            }, 500);
        }, 1500);

        // Setup navigation
        this.setupNavigation();
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.navigate(page);
            });
        });
    },

    navigate(page) {
        this.currentPage = page;

        // Update nav active state
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Reset page-specific states
        if (page === 'routines') {
            RoutinesPage.currentView = 'list';
            RoutinesPage.selectedRoutine = null;
        }
        if (page === 'exercises') {
            ExercisesPage.selectedExercise = null;
        }

        this.renderCurrentPage();

        // Scroll to top
        window.scrollTo(0, 0);
    },

    renderCurrentPage() {
        const content = document.getElementById('page-content');
        let html = '';

        switch (this.currentPage) {
            case 'dashboard': html = DashboardPage.render(); break;
            case 'routines': html = RoutinesPage.render(); break;
            case 'exercises': html = ExercisesPage.render(); break;
            case 'ai-coach': html = AICoachPage.render(); break;
            case 'progress': html = ProgressPage.render(); break;
            case 'assessment': html = AssessmentPage.render(); break;
            case 'muscle-stats': html = MuscleStatsPage.render(); break;
            case 'nutrition': html = NutritionPage.render(); break;
            case 'goals': html = GoalsPage.render(); break;
            case 'profile': html = ProfilePage.render(); break;
            default: html = DashboardPage.render();
        }

        content.innerHTML = html;
    },

    showOnboarding() {
        const modal = document.getElementById('onboarding-modal');
        modal.classList.remove('hidden');
        this.onboardingStep = 0;
        this.onboardingData = {};
        this.renderOnboardingStep();
    },

    onboardingSteps: [
        {
            icon: '👋',
            title: '¡Bienvenido a FitAI!',
            subtitle: 'Tu entrenador personal con inteligencia artificial. Vamos a configurar tu perfil para darte el mejor plan.',
            type: 'intro'
        },
        {
            icon: '📝',
            title: '¿Cómo te llamas?',
            subtitle: 'Para personalizar tu experiencia',
            type: 'input',
            field: 'name',
            placeholder: 'Tu nombre'
        },
        {
            icon: '🎯',
            title: '¿Cuál es tu objetivo?',
            subtitle: 'Esto define tu plan nutricional y de entrenamiento',
            type: 'options',
            field: 'goal',
            options: [
                { value: 'ganar músculo', icon: '💪', label: 'Ganar músculo' },
                { value: 'perder grasa', icon: '🔥', label: 'Perder grasa' },
                { value: 'recomposición', icon: '🔄', label: 'Recomposición' },
                { value: 'fuerza', icon: '🏋️', label: 'Ganar fuerza' }
            ]
        },
        {
            icon: '📊',
            title: '¿Tu nivel de experiencia?',
            subtitle: 'Sé honesto, esto afecta la programación',
            type: 'options',
            field: 'level',
            options: [
                { value: 'principiante', icon: '🌱', label: 'Principiante (0-1 año)' },
                { value: 'intermedio', icon: '💪', label: 'Intermedio (1-3 años)' },
                { value: 'avanzado', icon: '🏆', label: 'Avanzado (3+ años)' }
            ]
        },
        {
            icon: '📅',
            title: '¿Cuántos días puedes entrenar?',
            subtitle: 'Esto determina tu tipo de rutina',
            type: 'options',
            field: 'daysPerWeek',
            options: [
                { value: 3, icon: '3️⃣', label: '3 días' },
                { value: 4, icon: '4️⃣', label: '4 días' },
                { value: 5, icon: '5️⃣', label: '5 días' },
                { value: 6, icon: '6️⃣', label: '6 días' }
            ]
        },
        {
            icon: '⚖️',
            title: 'Datos físicos',
            subtitle: 'Para calcular tus macros y valoración',
            type: 'body',
            fields: ['weight', 'height', 'age', 'gender']
        }
    ],

    renderOnboardingStep() {
        const step = this.onboardingSteps[this.onboardingStep];
        const container = document.getElementById('onboarding-steps');
        const totalSteps = this.onboardingSteps.length;

        let html = `
            <div class="onboarding-step">
                <div class="onboarding-progress">
                    ${Array.from({length: totalSteps}, (_, i) => `
                        <div class="onboarding-dot ${i === this.onboardingStep ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                <div class="onboarding-icon">${step.icon}</div>
                <h2>${step.title}</h2>
                <p>${step.subtitle}</p>
        `;

        switch (step.type) {
            case 'intro':
                html += `<button class="btn btn-primary btn-full mt-3" onclick="App.nextOnboardingStep()">¡Empezar! 🚀</button>`;
                break;

            case 'input':
                html += `
                    <input type="text" class="form-input mt-2" id="onboard-input" placeholder="${step.placeholder}" value="${this.onboardingData[step.field] || ''}">
                    <button class="btn btn-primary btn-full mt-2" onclick="App.saveOnboardingInput('${step.field}')">Continuar →</button>
                `;
                break;

            case 'options':
                html += `
                    <div class="onboarding-options">
                        ${step.options.map(opt => `
                            <div class="onboarding-option ${this.onboardingData[step.field] === opt.value ? 'selected' : ''}" 
                                 onclick="App.selectOnboardingOption('${step.field}', '${opt.value}')">
                                <div class="option-icon">${opt.icon}</div>
                                <div class="option-label">${opt.label}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;

            case 'body':
                html += `
                    <div class="grid-2 gap-1 mt-2" style="text-align: left;">
                        <div class="form-group">
                            <label class="form-label">Peso (kg)</label>
                            <input type="number" class="form-input" id="onboard-weight" placeholder="70" value="${this.onboardingData.weight || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Altura (cm)</label>
                            <input type="number" class="form-input" id="onboard-height" placeholder="175" value="${this.onboardingData.height || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Edad</label>
                            <input type="number" class="form-input" id="onboard-age" placeholder="25" value="${this.onboardingData.age || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Género</label>
                            <select class="form-select" id="onboard-gender">
                                <option value="hombre">Hombre</option>
                                <option value="mujer">Mujer</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary btn-full mt-2" onclick="App.finishOnboarding()">🎉 Completar Setup</button>
                `;
                break;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    saveOnboardingInput(field) {
        const input = document.getElementById('onboard-input');
        if (input && input.value.trim()) {
            this.onboardingData[field] = input.value.trim();
            this.nextOnboardingStep();
        }
    },

    selectOnboardingOption(field, value) {
        this.onboardingData[field] = isNaN(value) ? value : parseInt(value);
        setTimeout(() => this.nextOnboardingStep(), 300);
    },

    nextOnboardingStep() {
        if (this.onboardingStep < this.onboardingSteps.length - 1) {
            this.onboardingStep++;
            this.renderOnboardingStep();
        }
    },

    finishOnboarding() {
        // Gather body data
        this.onboardingData.weight = parseFloat(document.getElementById('onboard-weight')?.value) || 70;
        this.onboardingData.height = parseFloat(document.getElementById('onboard-height')?.value) || 175;
        this.onboardingData.age = parseInt(document.getElementById('onboard-age')?.value) || 25;
        this.onboardingData.gender = document.getElementById('onboard-gender')?.value || 'hombre';

        // Save profile
        const profile = {
            ...Storage.getProfile(),
            ...this.onboardingData,
            startDate: new Date().toISOString()
        };
        Storage.setProfile(profile);
        Storage.setOnboarded();

        // Generate initial routine
        const routine = AIEngine.generateCustomRoutine(profile);
        Storage.saveRoutine(routine);

        // Close modal
        document.getElementById('onboarding-modal').classList.add('hidden');
        this.renderCurrentPage();
        Helpers.showToast('¡Perfil creado! Tu rutina ya está lista 💪');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
