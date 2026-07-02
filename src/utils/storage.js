// ===== LOCAL STORAGE MANAGER =====
const Storage = {
    PREFIX: 'fitai_',

    get(key) {
        try {
            const data = localStorage.getItem(this.PREFIX + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Storage get error:', e);
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Storage set error:', e);
            return false;
        }
    },

    remove(key) {
        localStorage.removeItem(this.PREFIX + key);
    },

    // User Profile
    getProfile() {
        return this.get('profile') || {
            name: '',
            age: 0,
            weight: 0,
            height: 0,
            gender: '',
            goal: '',
            level: 'principiante',
            daysPerWeek: 4,
            equipment: 'gym',
            injuries: [],
            startDate: null,
            targetWeight: 0,
            bodyFat: 0
        };
    },

    setProfile(profile) {
        return this.set('profile', profile);
    },

    // Routines
    getRoutines() {
        return this.get('routines') || [];
    },

    saveRoutine(routine) {
        const routines = this.getRoutines();
        const idx = routines.findIndex(r => r.id === routine.id);
        if (idx >= 0) routines[idx] = routine;
        else routines.push(routine);
        return this.set('routines', routines);
    },

    deleteRoutine(id) {
        const routines = this.getRoutines().filter(r => r.id !== id);
        return this.set('routines', routines);
    },


    // Active Routine
    getActiveRoutine() {
        return this.get('activeRoutine') || null;
    },

    setActiveRoutine(routine) {
        return this.set('activeRoutine', routine);
    },

    // Workout History
    getWorkoutHistory() {
        return this.get('workoutHistory') || [];
    },

    addWorkout(workout) {
        const history = this.getWorkoutHistory();
        history.push({ ...workout, date: new Date().toISOString() });
        return this.set('workoutHistory', history);
    },

    // Body Measurements
    getMeasurements() {
        return this.get('measurements') || [];
    },

    addMeasurement(measurement) {
        const measurements = this.getMeasurements();
        measurements.push({ ...measurement, date: new Date().toISOString() });
        return this.set('measurements', measurements);
    },

    // Progress Photos
    getPhotos() {
        return this.get('photos') || [];
    },

    addPhoto(photo) {
        const photos = this.getPhotos();
        photos.push({ ...photo, date: new Date().toISOString() });
        return this.set('photos', photos);
    },

    // Nutrition Log
    getNutritionLog() {
        return this.get('nutritionLog') || [];
    },

    addNutritionEntry(entry) {
        const log = this.getNutritionLog();
        log.push({ ...entry, date: new Date().toISOString() });
        return this.set('nutritionLog', log);
    },

    // AI Chat History
    getChatHistory() {
        return this.get('chatHistory') || [];
    },

    addChatMessage(message) {
        const history = this.getChatHistory();
        history.push(message);
        // Keep last 100 messages
        if (history.length > 100) history.splice(0, history.length - 100);
        return this.set('chatHistory', history);
    },

    clearChatHistory() {
        return this.set('chatHistory', []);
    },

    // Current Week
    getCurrentWeek() {
        const profile = this.getProfile();
        if (!profile.startDate) return 1;
        const start = new Date(profile.startDate);
        const now = new Date();
        const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
        return Math.min(Math.max(diff + 1, 1), 12);
    },

    // Personal Records
    getPRs() {
        return this.get('prs') || {};
    },

    updatePR(exerciseId, weight) {
        const prs = this.getPRs();
        if (!prs[exerciseId] || weight > prs[exerciseId].weight) {
            prs[exerciseId] = { weight, date: new Date().toISOString() };
            this.set('prs', prs);
            return true; // New PR!
        }
        return false;
    },

    // Onboarding
    isOnboarded() {
        return this.get('onboarded') === true;
    },

    setOnboarded() {
        return this.set('onboarded', true);
    },

    // Settings
    getSettings() {
        return this.get('settings') || {
            theme: 'dark',
            notifications: true,
            units: 'metric',
            restTimer: true,
            apiKey: ''
        };
    },

    setSettings(settings) {
        return this.set('settings', settings);
    },

    // User Preferences (extracted from AI conversations)
    getUserPreferences() {
        return this.get('userPreferences') || {
            trainingStyle: '',
            focusMuscles: '',
            avoidExercises: '',
            schedule: '',
            deadline: '',
            preferredExercises: [],
            notes: ''
        };
    },

    setUserPreferences(prefs) {
        return this.set('userPreferences', prefs);
    }
};
