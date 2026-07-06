// ===== AI ENGINE v4.0 - Google Gemini Powered =====
const AIEngine = {
    API_KEY: 'AIzaSyAb8RN6K6k_UaU4flQ1LpaPsFTp9WKd4kwlsvyVkNqnC7nChxjg',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',

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
            return 'Hubo un error al procesar tu pregunta. Intenta de nuevo en unos segundos.';
        }
    },

    // Call Google Gemini API
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
6. Usa formato con ** para negritas y listas con viñetas cuando sea util
7. Si preguntan algo completamente fuera de fitness/nutricion/salud, responde brevemente que solo manejas esos temas
8. NUNCA respondas sobre contenido sexual, ilegal, violento o sustancias prohibidas
9. Para calculos nutricionales usa Mifflin-St Jeor con los datos del usuario
10. Basa tus recomendaciones de entrenamiento en investigadores como Schoenfeld, Helms, Israetel y Nuckols
11. Se honesto y directo - no des respuestas genericas
12. Cuando des rutinas o planes, incluye ejercicios especificos con series, reps y pesos sugeridos basados en los PRs del usuario`;

        // Build conversation history for context
        const contents = [];
        chatHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'ai' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });

        const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstruction }]
                },
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    topP: 0.9
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_LOW_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error('Gemini error:', response.status, errData);
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            let text = data.candidates[0].content.parts[0].text;
            // Strip any emojis that Gemini might include
            text = text.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}|\u{FE00}-\u{FE0F}|\u{1F900}-\u{1F9FF}|\u{1FA00}-\u{1FA6F}|\u{1FA70}-\u{1FAFF}|\u{200D}|\u{20E3}|\u{FE0F}]/gu, '');
            return text.trim();
        }

        if (data.candidates && data.candidates[0] && data.candidates[0].finishReason === 'SAFETY') {
            return 'No puedo responder a esa pregunta por razones de seguridad. Preguntame sobre entrenamiento, nutricion o salud fisica.';
        }

        throw new Error('No valid response from API');
    },

    // Image analysis with Gemini Vision
    async analyzeImage(base64Image, question = '') {
        if (this.isBlocked(question)) {
            return 'No puedo ayudarte con eso.';
        }

        const userContext = this.buildUserContext();
        const prompt = question || 'Analiza esta foto de mi fisico. Dame una valoracion completa: estimacion de porcentaje de grasa corporal, puntos fuertes musculares, areas que necesitan mas trabajo, simetria, y un plan de accion concreto de 4 semanas para mejorar. Se directo y honesto.';

        try {
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
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
