// ===== HELPER FUNCTIONS =====
const Helpers = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    getWeekDays() {
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const today = new Date();
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

        return days.map((name, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return {
                name,
                number: date.getDate(),
                isToday: date.toDateString() === today.toDateString(),
                date: date.toISOString()
            };
        });
    },

    calculateBMI(weight, height) {
        return (weight / ((height / 100) ** 2)).toFixed(1);
    },

    calculateTDEE(weight, height, age, gender, activity) {
        let bmr;
        if (gender === 'hombre') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        const multipliers = {
            sedentario: 1.2,
            ligero: 1.375,
            moderado: 1.55,
            activo: 1.725,
            muyActivo: 1.9
        };

        return Math.round(bmr * (multipliers[activity] || 1.55));
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    // Exercise GIF system with multi-source fallback
    getExerciseGifUrl(exercise) {
        if (!exercise) return null;
        // Primary source: exercise's own gifUrl
        if (exercise.gifUrl) return exercise.gifUrl;
        return null;
    },

    // Creates an exercise display element with smart fallback
    renderExerciseMedia(exercise, options = {}) {
        if (!exercise) return '';
        const { maxHeight = '220px', showFallbackButtons = true } = options;
        const gifUrl = this.getExerciseGifUrl(exercise);
        const searchQuery = encodeURIComponent(exercise.name + ' exercise form');
        const muscleColor = exercise.muscle ? (typeof BodyMap !== 'undefined' ? BodyMap.colors[exercise.muscle] || '#22C55E' : '#22C55E') : '#22C55E';
        
        if (!gifUrl) {
            return this.renderExercisePlaceholder(exercise, muscleColor, searchQuery, showFallbackButtons);
        }

        return `
            <div class="exercise-gif-wrapper" style="background:#0a0a0a;border-radius:var(--radius-lg);overflow:hidden;border:1px solid var(--border);position:relative;min-height:180px;">
                <img src="${gifUrl}" 
                    alt="${exercise.name}" 
                    style="width:100%;max-height:${maxHeight};object-fit:contain;display:block;margin:0 auto;"
                    loading="lazy"
                    onerror="this.parentElement.innerHTML=Helpers.renderExercisePlaceholder(EXERCISES_DB.find(e=>e.id==='${exercise.id}'),'${muscleColor}','${searchQuery}',${showFallbackButtons})"
                />
                <div style="position:absolute;bottom:6px;right:8px;background:rgba(0,0,0,0.7);padding:2px 8px;border-radius:4px;font-size:0.6rem;color:var(--text-muted);">
                    ${exercise.muscle} | ${exercise.equipment}
                </div>
            </div>
        `;
    },

    renderExercisePlaceholder(exercise, muscleColor, searchQuery, showButtons) {
        if (!exercise) return '<div style="padding:2rem;text-align:center;color:var(--text-muted)">Ejercicio</div>';
        const encodedSearch = searchQuery || encodeURIComponent(exercise.name + ' exercise form');
        return `
            <div style="padding:1.5rem;text-align:center;background:linear-gradient(135deg, rgba(34,197,94,0.05), rgba(59,130,246,0.05));border-radius:var(--radius-lg);border:1px solid var(--border);min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.5rem;">
                <div style="width:60px;height:60px;border-radius:50%;background:${muscleColor}15;border:2px solid ${muscleColor}40;display:flex;align-items:center;justify-content:center;">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${muscleColor}" stroke-width="2" stroke-linecap="round">
                        <path d="M6.5 6.5h11M6.5 17.5h11M4 6.5a2.5 2.5 0 1 1 0 5M4 12.5a2.5 2.5 0 1 0 0 5M20 6.5a2.5 2.5 0 1 0 0 5M20 12.5a2.5 2.5 0 1 1 0 5M6.5 6.5v11M17.5 6.5v11"/>
                    </svg>
                </div>
                <p style="font-size:0.9rem;font-weight:700;color:var(--text-primary);margin:0;">${exercise.name}</p>
                <p style="font-size:0.72rem;color:var(--text-muted);margin:0;">${exercise.muscle} | ${exercise.sets}x${exercise.reps} | ${exercise.equipment}</p>
                ${showButtons ? `
                <div style="display:flex;gap:0.4rem;margin-top:0.4rem;">
                    <a href="https://www.youtube.com/results?search_query=${encodedSearch}" target="_blank" rel="noopener" 
                       style="padding:0.3rem 0.7rem;background:var(--primary);color:#000;border-radius:6px;font-size:0.68rem;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:0.2rem;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23 12l-22 12v-24l22 12z"/></svg>
                        Ver Video
                    </a>
                </div>` : ''}
            </div>
        `;
    },

    showToast(message, type = 'success') {
        // Remove any existing toasts
        document.querySelectorAll('.toast').forEach(t => t.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed; top: 70px; left: 50%; transform: translateX(-50%);
            background: var(--bg-card); color: ${type === 'success' ? 'var(--primary)' : type === 'error' ? 'var(--danger)' : 'var(--text-primary)'};
            padding: 0.65rem 1.25rem; border-radius: 10px;
            font-size: 0.8rem; font-weight: 500; z-index: 9999;
            animation: slideUp 0.3s ease; box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid ${type === 'success' ? 'var(--primary)' : type === 'error' ? 'var(--danger)' : 'var(--border)'};
            max-width: 88%; text-align: center; pointer-events: none;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
