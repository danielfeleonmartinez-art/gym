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

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
        toast.style.cssText = `
            position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)'};
            color: white; padding: 0.75rem 1.5rem; border-radius: 12px;
            font-size: 0.85rem; font-weight: 500; z-index: 9999;
            animation: slideUp 0.3s ease; box-shadow: var(--shadow);
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};
