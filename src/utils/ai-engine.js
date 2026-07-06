// ===== AI ENGINE v4.0 - Google Gemini Powered =====
const AIEngine = {
    // API key stored in localStorage - set via profile settings
    getApiKey() {
        return localStorage.getItem('gemini_api_key') || '';
    },
    setApiKey(key) {
        localStorage.setItem('gemini_api_key', key);
    },
    ENDPOINTS: [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent'
    ],

    // Content filter - blocks inappropriate content
    isBlocked(text) {
        const blocked = ['sexo','sexual','porno','desnud','drogas ilegal','matar','suicid',
            'arma','bomba','hackear','robar','xxx','onlyfans','violencia','violar',
            'terroris','pedofil','trafico','prostitu'];
        const lower = text.toLowerCase();
        return blocked.some(w => lower.includes(w));
    },

    // Build context about the user for personalized responses
    buildUserContext() {
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const w = profile.weight || 70;
        const h = profile.height || 175;
        const a = profile.age || 25;
        const bmi = (w / ((h/100)**2)).toFixed(1);
        const bmr = profile.gender === 'mujer' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
        const tdee = Math.round(bmr * 1.55);

        let prText = '';
        const prEntries = Object.entries(prs);
        if (prEntries.length > 0) {
            prText = prEntries.slice(0, 5).map(([id, data]) => {
                const ex = EXERCISES_DB.find(e => e.id === id);
                return ex ? `${ex.name}: ${data.weight}kg` : '';
            }).filter(Boolean).join(', ');
        }

        return `DATOS DEL USUARIO:
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${a} | Genero: ${profile.gender || 'hombre'}
- Peso: ${w}kg | Altura: ${h}cm | IMC: ${bmi}
- BMR: ${Math.round(bmr)} kcal | TDEE estimado: ${tdee} kcal
- Objetivo: ${profile.goal || 'ganar musculo'}
- Nivel: ${profile.level || 'intermedio'}
- Dias de entreno: ${profile.daysPerWeek || 4}/semana
- Equipamiento: ${profile.equipment || 'gym completo'}
- Semana del programa: ${week}/12
- Fase actual: ${periodWeek.phase} | Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}
- Entrenamientos completados: ${workouts.length}
${prText ? '- PRs: ' + prText : ''}
${periodWeek.deload ? '- NOTA: Esta en semana de DELOAD (debe reducir volumen e intensidad)' : ''}`;
    },

    // Main response generator - uses Gemini API
    async generateResponse(prompt, context = {}) {
        // Content filter
        if (this.isBlocked(prompt)) {
            return 'No puedo ayudarte con eso. Solo respondo sobre fitness, nutricion, entrenamiento y salud fisica.';
        }

        // Special command: create routine
        const lower = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (this.matchesRoutineCreation(lower)) {
            return this.handleRoutineCreation();
        }

        try {
            return await this.callGemini(prompt);
        } catch (error) {
            console.error('Gemini API error:', error);
            // Fallback to intelligent local response
            return this.localFallback(prompt, lower);
        }
    },

    // Intelligent local fallback when API fails
    localFallback(prompt, input) {
        const profile = Storage.getProfile();
        const w = profile.weight || 70;
        const h = profile.height || 175;
        const a = profile.age || 25;
        const bmr = profile.gender === 'mujer' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
        const tdee = Math.round(bmr * 1.55);
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        // Try to match common topics
        if (input.includes('entreno hoy') || input.includes('que hago hoy') || input.includes('entrenamiento')) {
            const days = profile.daysPerWeek || 4;
            let templateKey = days <= 3 ? 'fullBody' : days === 4 ? 'upperLower' : 'ppl';
            const template = ROUTINE_TEMPLATES[templateKey];
            const workoutsThisWeek = Storage.getWorkoutHistory().filter(wk => {
                const d = new Date(wk.date); const now = new Date();
                const monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0,0,0,0);
                return d >= monday;
            }).length;
            const dayIndex = workoutsThisWeek % template.days.length;
            const todayPlan = template.days[dayIndex];
            const prs = Storage.getPRs();
            let r = '**Entrenamiento de Hoy: ' + todayPlan.name + '**\nSemana ' + week + '/12 | Fase: ' + periodWeek.phase + ' | RPE ' + periodWeek.rpe + '\n\n---\n';
            todayPlan.exercises.forEach((exId, i) => {
                const ex = EXERCISES_DB.find(e => e.id === exId);
                if (!ex) return;
                const pr = prs[exId];
                const sugW = pr ? Math.round(pr.weight * (periodWeek.intensity / 100)) : null;
                r += '\n**' + (i+1) + '. ' + ex.name + '**\n' + ex.sets + ' series x ' + ex.reps + (sugW ? ' | ~' + sugW + 'kg' : '') + ' | Descanso: ' + ex.rest + 's\n';
            });
            r += '\n---\n\nCalienta 5-10 min antes. Ultima serie cerca del fallo (RPE ' + periodWeek.rpe + ').';
            return r;
        }

        if (input.includes('nutri') || input.includes('dieta') || input.includes('caloria') || input.includes('macro') || input.includes('comer')) {
            const goal = profile.goal || 'ganar musculo';
            let targetCals = goal.includes('perder') ? Math.round(tdee - 400) : Math.round(tdee + 300);
            let protein = Math.round(w * 2.2);
            let fats = Math.round(w * 0.9);
            let carbs = Math.round((targetCals - protein*4 - fats*9) / 4);
            return '**Plan Nutricional**\n' + w + 'kg | Objetivo: ' + goal + '\n\n---\n\n**Tus numeros:**\n- TDEE: ' + tdee + ' kcal\n- Objetivo: **' + targetCals + ' kcal/dia**\n\n**Macros:**\n- Proteina: **' + protein + 'g** (' + Math.round(protein*4/targetCals*100) + '%)\n- Carbohidratos: **' + carbs + 'g** (' + Math.round(carbs*4/targetCals*100) + '%)\n- Grasas: **' + fats + 'g** (' + Math.round(fats*9/targetCals*100) + '%)\n\n**Distribucion:**\n- Desayuno: ~' + Math.round(targetCals*0.25) + ' kcal\n- Almuerzo: ~' + Math.round(targetCals*0.30) + ' kcal\n- Pre-entreno: ~' + Math.round(targetCals*0.15) + ' kcal\n- Cena: ~' + Math.round(targetCals*0.20) + ' kcal\n- Snack: ~' + Math.round(targetCals*0.10) + ' kcal';
        }

        if (input.includes('suplement') || input.includes('creatina') || input.includes('whey')) {
            return '**Suplementacion basada en evidencia**\n\n**Tier 1 (imprescindibles):**\n1. Creatina Monohidrato - 5g/dia siempre\n2. Proteina Whey - solo si no llegas a ' + Math.round(w*2) + 'g con comida\n3. Vitamina D3 - 2000-4000 IU/dia\n\n**Tier 2 (utiles):**\n4. Magnesio glicinato - 400mg antes de dormir\n5. Omega-3 - 2-3g/dia\n6. Cafeina - ' + Math.round(w*4) + 'mg pre-entreno\n\n**No malgastes en:** BCAAs, quemadores, boosters de testosterona.\n\nPrioridad: Sueno > Nutricion > Entreno > Suplementos';
        }

        if (input.includes('rutina') || input.includes('programa') || input.includes('plan')) {
            return this.handleRoutineCreation();
        }

        if (input.includes('hola') || input.includes('buenas') || input.includes('que tal')) {
            return 'Hola, ' + (profile.name || 'crack') + '. Semana ' + week + '/12, fase ' + periodWeek.phase + ', RPE ' + periodWeek.rpe + '. Preguntame lo que necesites sobre entrenamiento, nutricion o cualquier tema de fitness.';
        }

        // Generic fallback
        return '**Sobre tu pregunta:**\n\n"' + prompt + '"\n\nPuedo ayudarte con:\n- Rutinas y ejercicios personalizados\n- Nutricion, macros y planes de comida\n- Suplementacion\n- Lesiones y recuperacion\n- Progresion y estancamientos\n- Objetivos con timeline\n\nPrueba con: "Que entreno hoy?", "Dame mi plan nutricional", "Creame una rutina nueva"';
    },

    // Call Google Gemini API - tries multiple endpoints
    async callGemini(prompt) {
        const userContext = this.buildUserContext();
        const chatHistory = Storage.getChatHistory().slice(-8);

        const systemInstruction = `Eres un entrenador personal de elite, nutricionista deportivo certificado y coach de rendimiento fisico. Tu nombre es FitAI Coach.

${userContext}

REGLAS ESTRICTAS:
1. Responde SIEMPRE en espanol
2. NO uses emojis nunca. Ni uno solo.
3. Se directo, conciso y basado en evidencia cientifica
4. Da numeros concretos siempre: peso, series, reps, kcal, gramos
5. Personaliza TODO al perfil del usuario (usa sus datos arriba)
6. Usa formato con ** para negritas y listas con vinetas cuando sea util
7. Si preguntan algo completamente fuera de fitness/nutricion/salud, responde brevemente que solo manejas esos temas
8. NUNCA respondas sobre contenido sexual, ilegal, violento o sustancias prohibidas
9. Para calculos nutricionales usa Mifflin-St Jeor con los datos del usuario
10. Basa tus recomendaciones de entrenamiento en investigadores como Schoenfeld, Helms, Israetel y Nuckols
11. Se honesto y directo - no des respuestas genericas
12. Cuando des rutinas o planes, incluye ejercicios especificos con series, reps y pesos sugeridos basados en los PRs del usuario`;

        const contents = [];
        chatHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        contents.push({ role: 'user', parts: [{ text: prompt }] });

        const body = JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.9 },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        });

        // Try each endpoint until one works
        let lastError = null;
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('No API key configured');
        }
        for (const endpoint of this.ENDPOINTS) {
            try {
                const response = await fetch(`${endpoint}?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: body
                });

                if (!response.ok) {
                    lastError = new Error(`${endpoint}: HTTP ${response.status}`);
                    continue;
                }

                const data = await response.json();

                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                    let text = data.candidates[0].content.parts[0].text;
                    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, '');
                    return text.trim();
                }

                if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
                    return 'No puedo responder a esa pregunta por razones de seguridad. Preguntame sobre entrenamiento, nutricion o salud fisica.';
                }

                lastError = new Error('No valid response');
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        throw lastError || new Error('All endpoints failed');
    },

    // Image analysis with Gemini Vision
    async analyzeImage(base64Image, question = '') {
        if (this.isBlocked(question)) {
            return 'No puedo ayudarte con eso.';
        }

        const userContext = this.buildUserContext();
        const prompt = question || 'Analiza esta foto de mi fisico. Dame una valoracion completa: estimacion de porcentaje de grasa corporal, puntos fuertes musculares, areas que necesitan mas trabajo, simetria, y un plan de accion concreto de 4 semanas para mejorar. Se directo y honesto.';

        try {
            const response = await fetch(`${this.ENDPOINTS[0]}?key=${this.getApiKey()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: `Eres un entrenador personal experto y juez de fitness. ${userContext}\n\nREGLAS: Responde en espanol. NO uses emojis. Se directo, honesto y constructivo. Da porcentajes, medidas y planes concretos.` }]
                    },
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inline_data: { mime_type: 'image/jpeg', data: base64Image } }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.6,
                        maxOutputTokens: 1500
                    }
                })
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                let text = data.candidates[0].content.parts[0].text;
                text = text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{FE00}-\u{FE0F}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{200D}|\u{20E3}|\u{FE0F}]/gu, '');
                return text.trim();
            }
            return 'No pude analizar la imagen. Intenta con otra foto con mejor iluminacion.';
        } catch (error) {
            console.error('Vision error:', error);
            return 'Error al analizar la imagen. Verifica tu conexion e intenta de nuevo.';
        }
    },

    // Check if user wants to create/save a routine
    matchesRoutineCreation(text) {
        const triggers = ['creame una rutina','hazme una rutina','arma mi rutina','genera mi rutina',
            'crea mi programa','quiero una rutina nueva','necesito una rutina','generame una rutina',
            'guardar rutina','crear rutina'];
        return triggers.some(t => text.includes(t));
    },

    // Handle routine creation (saves to storage)
    handleRoutineCreation() {
        const profile = Storage.getProfile();
        const routine = this.generateCustomRoutine(profile);
        Storage.saveRoutine(routine);
        return `Rutina creada y guardada: "${routine.name}"\n\nBasada en tu perfil:\n- Nivel: ${profile.level || 'intermedio'}\n- Dias: ${profile.daysPerWeek || 4}/semana\n- Objetivo: ${profile.goal || 'ganar musculo'}\n\nIncluye ${routine.days.length} dias de entrenamiento. Ve a la seccion Entreno para verla y ejecutarla.\n\nSi quieres que te explique la rutina en detalle o la ajuste, preguntame.`;
    },

    // Generate and save a routine
    generateCustomRoutine(profile) {
        const days = profile.daysPerWeek || 4;
        let templateKey = days <= 3 ? 'fullBody' : days === 4 ? 'upperLower' : days === 5 ? 'bro' : 'ppl';
        const template = ROUTINE_TEMPLATES[templateKey];
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        return {
            id: 'ai-generated-' + Date.now(),
            name: template.name + ' (IA)',
            description: 'Generada por IA - Semana ' + week + ' - ' + periodWeek.phase,
            template: templateKey,
            days: template.days.map(day => ({
                name: day.name,
                exercises: day.exercises.map(exId => {
                    const exercise = EXERCISES_DB.find(e => e.id === exId);
                    if (!exercise) return exId;
                    return { ...exercise, targetSets: exercise.sets, targetReps: exercise.reps, intensity: periodWeek.intensity, rpe: periodWeek.rpe };
                })
            })),
            weekCreated: week,
            phase: periodWeek.phase,
            createdAt: new Date().toISOString()
        };
    }
};
