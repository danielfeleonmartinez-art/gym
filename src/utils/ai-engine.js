// ===== AI ENGINE v2.0 - Motor de IA Conversacional Avanzado =====
const AIEngine = {
    // API Key para OpenAI (configurable)
    getApiKey() {
        return Storage.getSettings().apiKey || '';
    },

    // Genera respuesta usando OpenAI API si hay key, sino usa motor local avanzado
    async generateResponse(prompt, context = {}) {
        const apiKey = this.getApiKey();
        if (apiKey) {
            return await this.callOpenAI(prompt, context);
        }
        return this.localAI(prompt, context);
    },

    // Llamada a OpenAI con contexto completo del usuario
    async callOpenAI(prompt, context) {
        const apiKey = this.getApiKey();
        const profile = Storage.getProfile();
        const systemPrompt = this.buildSystemPrompt(profile, context);
        const chatHistory = Storage.getChatHistory().slice(-10);

        const messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Incluir historial reciente para contexto conversacional
        chatHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'ai' ? 'assistant' : 'user',
                content: msg.content
            });
        });

        messages.push({ role: 'user', content: prompt });

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages,
                    max_tokens: 2000,
                    temperature: 0.7
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            return this.localAI(prompt, context);
        } catch (error) {
            console.error('OpenAI API Error:', error);
            return this.localAI(prompt, context);
        }
    },

    // Análisis de imagen con OpenAI Vision
    async analyzeImage(base64Image, question = '') {
        const apiKey = this.getApiKey();
        if (apiKey) {
            // Try OpenAI if key exists
            const profile = Storage.getProfile();
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: `Eres un entrenador personal experto y juez de fitness. El usuario se llama ${profile.name || 'Usuario'}, pesa ${profile.weight || '?'}kg, mide ${profile.height || '?'}cm, tiene ${profile.age || '?'} años, nivel ${profile.level || 'intermedio'}, objetivo: ${profile.goal || 'mejorar físico'}. Analiza la imagen de forma honesta, directa y constructiva. Da % grasa estimado, puntos fuertes, débiles, y recomendaciones concretas.` },
                            { role: 'user', content: [
                                { type: 'text', text: question || 'Analiza esta foto de mi físico. Dame una valoración completa: estimación de % de grasa corporal, puntos fuertes musculares, áreas que necesitan más trabajo, simetría, y un plan de acción de 4 semanas para mejorar. Sé directo y honesto.' },
                                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                            ]}
                        ],
                        max_tokens: 1500
                    })
                });

                const data = await response.json();
                if (data.choices && data.choices[0]) {
                    return data.choices[0].message.content;
                }
                return this.localImageAnalysis(question);
            } catch(e) {
                return this.localImageAnalysis(question);
            }
        }
        return this.localImageAnalysis(question);
    },

    buildSystemPrompt(profile, context) {
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const prefs = Storage.getUserPreferences();

        return `Eres FitAI, un entrenador personal de ÉLITE, nutricionista deportivo y coach de rendimiento.
Tu objetivo es que ${profile.name || 'el usuario'} consiga la MEJOR versión de su físico en 3-4 meses.

DATOS DEL USUARIO:
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age || '?'} años | Género: ${profile.gender || '?'}
- Peso: ${profile.weight || '?'}kg | Altura: ${profile.height || '?'}cm
- IMC: ${profile.weight && profile.height ? (profile.weight / ((profile.height/100)**2)).toFixed(1) : '?'}
- Objetivo principal: ${profile.goal || 'mejorar físico'}
- Nivel: ${profile.level || 'intermedio'}
- Días disponibles: ${profile.daysPerWeek || 4}/semana
- Equipamiento: ${profile.equipment || 'gym completo'}
- Lesiones/limitaciones: ${profile.injuries && profile.injuries.length > 0 ? profile.injuries.join(', ') : 'ninguna reportada'}

ESTADO DEL PROGRAMA:
- Semana actual: ${week}/12
- Fase: ${periodWeek.phase}
- Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}
- Total entrenamientos completados: ${workouts.length}
- PRs registrados: ${Object.keys(prs).length}
${periodWeek.deload ? '⚠️ SEMANA DE DELOAD - el usuario debe reducir volumen e intensidad' : ''}

PREFERENCIAS DEL USUARIO:
${prefs.trainingStyle ? '- Estilo: ' + prefs.trainingStyle : ''}
${prefs.focusMuscles ? '- Músculos prioritarios: ' + prefs.focusMuscles : ''}
${prefs.avoidExercises ? '- Ejercicios a evitar: ' + prefs.avoidExercises : ''}
${prefs.schedule ? '- Horario de entreno: ' + prefs.schedule : ''}
${prefs.deadline ? '- Fecha objetivo: ' + prefs.deadline : ''}

REGLAS DE RESPUESTA:
1. Responde SIEMPRE en español
2. Sé directo, práctico y basado en evidencia científica
3. Si el usuario te dice CUÁNDO quiere lograr algo, calcula si es realista y ajusta el plan
4. Si te dice QUÉ quiere entrenar hoy, dale un entrenamiento COMPLETO con series, reps, peso sugerido
5. Si te dice CÓMO quiere entrenar (más intenso, menos tiempo, etc.), adapta todo
6. Usa periodización ondulante DUP, progresión de cargas y principios de hipertrofia basados en Schoenfeld, Helms y Nuckols
7. Para nutrición, calcula con precisión usando Mifflin-St Jeor + multiplicador de actividad
8. Da SIEMPRE números concretos: peso, series, reps, kcal, gramos
9. No seas genérico. Personaliza TODO al perfil del usuario
10. Usa emojis para hacer visual pero no abuses
11. Si preguntan algo fuera de fitness/nutrición, responde brevemente y redirige al entrenamiento
12. RECUERDA el contexto de la conversación anterior`;
    },


    // ===== MOTOR LOCAL DE IA v2.0 - Conversacional Avanzado =====
    localAI(prompt, context) {
        const lowerPrompt = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];
        const prefs = Storage.getUserPreferences();

        // ===== FILTRO DE CONTENIDO - Bloquea contenido sexual/ilegal =====
        const blockedWords = ['sexo', 'sexual', 'porno', 'desnud', 'drogas ilegales', 'esteroides ilegales', 'matar', 'suicid', 'arma', 'bomba', 'hackear', 'robar', 'violencia', 'xxx', 'onlyfans'];
        if (blockedWords.some(word => lowerPrompt.includes(word))) {
            return `No puedo ayudarte con eso. Solo respondo preguntas sobre fitness, nutrición, entrenamiento y salud física. ¿En qué puedo ayudarte dentro de esos temas?`;
        }

        // Guardar preferencias si el usuario las indica
        this.extractAndSavePreferences(prompt, lowerPrompt);

        // ===== DETECCIÓN INTELIGENTE DE INTENCIÓN =====

        // User wants AI to CREATE and SAVE a routine
        if (this.matchesIntent(lowerPrompt, ['creame una rutina', 'hazme una rutina', 'arma mi rutina', 'genera mi rutina', 'crea mi programa', 'quiero una rutina nueva', 'necesito una rutina'])) {
            const routine = this.generateCustomRoutine(profile);
            Storage.saveRoutine(routine);
            return `✅ **¡Rutina creada y guardada!**\n\nHe generado tu rutina personalizada "${routine.name}" basada en:\n• Tu nivel: ${profile.level}\n• Días disponibles: ${profile.daysPerWeek}/semana\n• Objetivo: ${profile.goal}\n• Fase actual: ${periodWeek.phase}\n\n📋 **Incluye ${routine.days.length} días:**\n${routine.days.map((d, i) => '• Día ' + (i+1) + ': ' + d.name).join('\n')}\n\n→ Ve a la sección **💪 Rutinas** para verla y empezar a entrenar.\n\n¿Quieres que ajuste algo?`;
        }

        // 1. El usuario quiere entrenar AHORA o pregunta qué hacer hoy
        if (this.matchesIntent(lowerPrompt, ['que hago hoy', 'que entreno hoy', 'entrenamiento de hoy', 'que toca hoy', 'dame el entreno', 'voy al gym', 'que puedo hacer hoy', 'sesion de hoy', 'workout de hoy', 'entreno hoy'])) {
            return this.generateTodayWorkout(profile, periodWeek, prefs);
        }

        // 2. Quiere una rutina para un músculo específico
        if (this.matchesMuscleRequest(lowerPrompt)) {
            return this.generateMuscleWorkout(lowerPrompt, profile, periodWeek);
        }

        // 3. Pregunta por ejercicios específicos o mejores ejercicios
        if (this.matchesIntent(lowerPrompt, ['mejor ejercicio', 'mejores ejercicios', 'que ejercicio', 'ejercicios para', 'como hacer', 'tecnica de', 'alternativa a', 'sustituir'])) {
            return this.generateExerciseAdvice(lowerPrompt, profile);
        }

        // 4. Quiere rutina personalizada / programa completo
        if (this.matchesIntent(lowerPrompt, ['rutina', 'programa', 'plan de entrenamiento', 'planificacion', 'mesociclo', 'hazme un plan', 'crea una rutina', 'diseña', 'arma'])) {
            return this.generateFullProgram(profile, periodWeek, lowerPrompt, prefs);
        }

        // 5. Indicaciones temporales (quiero estar listo para X fecha)
        if (this.matchesIntent(lowerPrompt, ['para cuando', 'en cuanto tiempo', 'meses', 'semanas', 'antes de', 'para el verano', 'para diciembre', 'para enero', 'tengo', 'plazo', 'deadline', 'fecha'])) {
            return this.generateTimelinePlan(lowerPrompt, profile, periodWeek);
        }

        // 6. Nutrición detallada
        if (this.matchesIntent(lowerPrompt, ['nutri', 'dieta', 'comer', 'comida', 'macro', 'calor', 'proteina', 'carbohidrato', 'grasa', 'desayuno', 'almuerzo', 'cena', 'snack', 'receta', 'que como', 'cuanto debo comer', 'meal prep'])) {
            return this.generateDetailedNutrition(lowerPrompt, profile);
        }

        // 7. Valoración física
        if (this.matchesIntent(lowerPrompt, ['valorar', 'valoraci', 'evalua', 'estado', 'como estoy', 'como voy', 'donde estoy', 'nivel'])) {
            return this.generateDetailedAssessment(profile, periodWeek);
        }

        // 8. Progreso y resultados
        if (this.matchesIntent(lowerPrompt, ['progreso', 'avance', 'resultado', 'cuanto he mejorado', 'estadistica', 'resumen'])) {
            return this.generateDetailedProgress(profile);
        }

        // 9. Dolor, lesión o molestia
        if (this.matchesIntent(lowerPrompt, ['dolor', 'lesion', 'molestia', 'me duele', 'lastim', 'pinzamiento', 'tendinitis', 'hombro', 'rodilla', 'espalda baja', 'lumbar'])) {
            return this.generateInjuryAdvice(lowerPrompt, profile);
        }

        // 10. Suplementación
        if (this.matchesIntent(lowerPrompt, ['suplement', 'creatina', 'whey', 'pre-entreno', 'pre entreno', 'bcaa', 'vitamina', 'omega'])) {
            return this.generateDetailedSupplements(profile, lowerPrompt);
        }

        // 11. Cardio
        if (this.matchesIntent(lowerPrompt, ['cardio', 'correr', 'hiit', 'liss', 'aerobico', 'bicicleta', 'nadar', 'quemar grasa', 'acondicionamiento'])) {
            return this.generateCardioAdvice(profile, lowerPrompt);
        }

        // 12. Descanso / Recovery / Sueño
        if (this.matchesIntent(lowerPrompt, ['descanso', 'dormir', 'sueno', 'recuper', 'sobreentren', 'fatiga', 'estres', 'deload'])) {
            return this.generateDetailedRecovery(profile, periodWeek);
        }

        // 13. Motivación
        if (this.matchesIntent(lowerPrompt, ['motiv', 'animo', 'no quiero', 'cansad', 'pereza', 'flojera', 'no puedo', 'rendir', 'abandonar', 'dificil'])) {
            return this.generateMotivation(profile);
        }

        // 14. Comparación o dudas técnicas
        if (this.matchesIntent(lowerPrompt, ['es mejor', 'que es mejor', 'diferencia entre', 'vs', 'conviene', 'deberia', 'que hago si', 'sirve'])) {
            return this.generateComparison(lowerPrompt, profile);
        }

        // 15. Preguntas sobre estética / músculos específicos
        if (this.matchesIntent(lowerPrompt, ['como tener', 'como sacar', 'como marcar', 'abdominales', 'six pack', 'brazos grandes', 'espalda ancha', 'hombros grandes', 'pecho grande', 'gluteos', 'piernas grandes'])) {
            return this.generateAestheticAdvice(lowerPrompt, profile);
        }

        // 16. Volumen, intensidad, frecuencia
        if (this.matchesIntent(lowerPrompt, ['cuantas series', 'cuantas reps', 'cuanto volumen', 'frecuencia', 'cuantos dias', 'cuanto peso', 'rpe', 'rir', 'al fallo', 'intensidad'])) {
            return this.generateTrainingScience(lowerPrompt, profile, periodWeek);
        }

        // 17. Estancamiento / Plateau
        if (this.matchesIntent(lowerPrompt, ['estancad', 'no progreso', 'no avanzo', 'plateau', 'no subo peso', 'no crezco', 'igual', 'no cambio', 'no veo resultados'])) {
            return this.generatePlateauAdvice(profile, periodWeek);
        }

        // 18. Saludo o conversación general
        if (this.matchesIntent(lowerPrompt, ['hola', 'hey', 'buenas', 'que tal', 'como estas', 'buenos dias', 'buenas tardes', 'buenas noches'])) {
            return this.generateGreeting(profile, periodWeek);
        }

        // 1RM Calculator
        if (this.matchesIntent(lowerPrompt, ['1rm', 'maximo', 'rm', 'repeticion maxima', 'calcula mi maximo', 'calcular mi 1rm'])) {
            const weight = profile.weight || 70;
            return `🏆 **Calculadora de 1RM (Repetición Máxima)**\n\nPara calcular tu máximo teórico, dime:\n• Peso que levantas\n• Repeticiones que haces\n\nEjemplo: "Hago 80kg por 8 reps en bench"\n\n**Fórmula rápida (Brzycki):**\n• 80kg × 8 reps = **~101kg de 1RM**\n\n**Tabla de porcentajes:**\n| % | Peso | Reps | Uso |\n|---|------|------|-----|\n| 100% | 1RM | 1 | Test |\n| 90% | ${Math.round(weight*1.2*0.9)}kg | 3 | Fuerza |\n| 80% | ${Math.round(weight*1.2*0.8)}kg | 8 | Hipertrofia |\n| 70% | ${Math.round(weight*1.2*0.7)}kg | 12 | Resistencia |\n\nDime un ejercicio con peso y reps y te calculo el 1RM exacto.`;
        }

        // Somatotype question
        if (this.matchesIntent(lowerPrompt, ['somatotipo', 'tipo de cuerpo', 'ectomorfo', 'mesomorfo', 'endomorfo', 'que tipo de cuerpo', 'mi tipo de cuerpo'])) {
            const soma = FitnessTools.getSomatotype(profile);
            return `🧬 **Tu Somatotipo: ${soma.type}**\n\n${soma.description}\n\n**🏋️ Entrenamiento ideal para ti:**\n${soma.training.map(t => '• ' + t).join('\n')}\n\n**🥗 Nutrición ideal:**\n${soma.nutrition.map(n => '• ' + n).join('\n')}\n\n💡 Recuerda: nadie es 100% un solo tipo. La mayoría somos una mezcla, pero tu tipo dominante define la estrategia óptima.`;
        }

        // 19. Agradecimiento
        if (this.matchesIntent(lowerPrompt, ['gracias', 'genial', 'perfecto', 'excelente', 'crack', 'buenisimo', 'me encanta', 'eres el mejor'])) {
            return this.generateThankYouResponse(profile);
        }

        // Default: Intenta responder basado en contexto
        return this.generateContextualResponse(prompt, lowerPrompt, profile, periodWeek);
    },

    // ===== UTILIDADES DE MATCHING =====
    matchesIntent(text, keywords) {
        return keywords.some(kw => text.includes(kw));
    },

    matchesMuscleRequest(text) {
        const muscles = ['pecho', 'espalda', 'hombro', 'pierna', 'biceps', 'triceps', 'core', 'abdomen', 'gluteo', 'pantorrilla', 'antebrazo', 'trapecio'];
        const actions = ['entrena', 'trabaja', 'hoy toca', 'quiero', 'dame', 'rutina de', 'ejercicios de', 'sesion de'];
        const hasMuscle = muscles.some(m => text.includes(m));
        const hasAction = actions.some(a => text.includes(a));
        return hasMuscle && hasAction;
    },

    // ===== EXTRACCIÓN DE PREFERENCIAS =====
    extractAndSavePreferences(prompt, lowerPrompt) {
        const prefs = Storage.getUserPreferences();
        let changed = false;

        // Detectar horario
        const timeMatch = prompt.match(/entreno (?:a las?|por la) (\d+|mañana|tarde|noche)/i);
        if (timeMatch) {
            prefs.schedule = timeMatch[0];
            changed = true;
        }

        // Detectar músculos prioritarios
        const focusMatch = prompt.match(/(?:quiero|necesito|priorizar?|enfocarme en|mejorar) (?:mis? )?(pecho|espalda|hombros?|piernas?|brazos?|bíceps|tríceps|abdomen|glúteos?)/i);
        if (focusMatch) {
            prefs.focusMuscles = (prefs.focusMuscles ? prefs.focusMuscles + ', ' : '') + focusMatch[2];
            changed = true;
        }

        // Detectar deadline
        const deadlineMatch = prompt.match(/(?:para|antes de|en) (\d+ (?:meses?|semanas?)|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))/i);
        if (deadlineMatch) {
            prefs.deadline = deadlineMatch[1];
            changed = true;
        }

        // Detectar estilo
        const styleMatch = prompt.match(/(?:me gusta|prefiero|quiero) (?:entrenar? )?(pesado|ligero|rápido|intenso|con máquinas|con mancuernas|con barra|funcional|calistenia|crossfit|powerlifting|bodybuilding)/i);
        if (styleMatch) {
            prefs.trainingStyle = styleMatch[1];
            changed = true;
        }

        if (changed) {
            Storage.setUserPreferences(prefs);
        }
    },


    // ===== GENERADORES DE RESPUESTA INTELIGENTES =====

    generateTodayWorkout(profile, periodWeek, prefs) {
        const dayOfWeek = new Date().getDay(); // 0=dom, 1=lun...
        const days = profile.daysPerWeek || 4;
        const level = profile.level || 'intermedio';
        const workoutsThisWeek = Storage.getWorkoutHistory().filter(w => {
            const d = new Date(w.date);
            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
            monday.setHours(0,0,0,0);
            return d >= monday;
        });

        const completedToday = workoutsThisWeek.length;
        const isDeload = periodWeek.deload;
        const rpe = periodWeek.rpe;

        // Determinar qué toca hoy basado en split y día de la semana
        let templateKey = days <= 3 ? 'fullBody' : days === 4 ? 'upperLower' : days >= 5 ? 'ppl' : 'upperLower';
        const template = ROUTINE_TEMPLATES[templateKey];
        const dayIndex = completedToday % template.days.length;
        const todayPlan = template.days[dayIndex];

        // Construir entrenamiento con pesos sugeridos
        const prs = Storage.getPRs();
        const exerciseDetails = todayPlan.exercises.map(exId => {
            const ex = EXERCISES_DB.find(e => e.id === exId);
            if (!ex) return null;
            const pr = prs[exId];
            const suggestedWeight = pr ? Math.round(pr.weight * (periodWeek.intensity / 100)) : '?';
            const sets = isDeload ? Math.max(2, ex.sets - 1) : ex.sets;
            const reps = isDeload ? '8-12 (fácil)' : ex.reps;
            return { ...ex, suggestedWeight, sets, reps, targetRPE: rpe };
        }).filter(Boolean);

        return `💪 **Tu Entrenamiento de Hoy**

📅 **${todayPlan.name}**
📊 Semana ${Storage.getCurrentWeek()}/12 | Fase: ${periodWeek.phase} | RPE: ${rpe}
${isDeload ? '🟢 **DELOAD** - Peso ligero, enfócate en técnica y conexión mente-músculo\n' : ''}
---

${exerciseDetails.map((ex, i) => `
**${i + 1}. ${ex.icon} ${ex.name}**
   → ${ex.sets} series × ${ex.reps} reps
   → Peso sugerido: **${ex.suggestedWeight}kg** (RPE ${ex.targetRPE})
   → Descanso: ${ex.rest}s
   💡 ${ex.tips[0]}
`).join('')}

---
⏱️ **Duración estimada:** ${isDeload ? '40-50' : '55-70'} minutos
🔥 **Volumen estimado:** ~${exerciseDetails.reduce((sum, ex) => sum + (ex.suggestedWeight !== '?' ? ex.suggestedWeight * 10 * ex.sets : 0), 0)}kg total

**📋 Instrucciones:**
${isDeload ? 
'• Usa el 55-60% de tu máximo\n• No llegues al fallo en ninguna serie\n• Enfócate en sentir cada músculo\n• Si algo duele, sáltalo' :
'• Calienta 5-10min (cardio ligero + movilidad)\n• Series de aproximación antes de los compound pesados\n• Última serie de cada ejercicio: llega cerca del fallo (RPE ' + rpe + ')\n• Anota todos tus pesos para progresar la próxima semana'}

${prefs.focusMuscles ? `\n🎯 **Nota:** Como priorizas ${prefs.focusMuscles}, haz 1 serie extra en esos ejercicios.` : ''}

¿Listo para darle? 🔥 Si quieres cambiar algo o ajustar ejercicios, dime.`;
    },

    generateMuscleWorkout(lowerPrompt, profile, periodWeek) {
        const muscles = {
            pecho: { name: 'Pecho', exercises: ['bench-press', 'incline-bench', 'dumbbell-fly', 'cable-crossover', 'dip-chest', 'push-ups'], science: 'El pecho responde mejor a estiramiento bajo carga (aperturas) y presses en distintos ángulos. 10-20 series/semana es óptimo.' },
            espalda: { name: 'Espalda', exercises: ['pull-ups', 'barbell-row', 'lat-pulldown', 'seated-row', 'deadlift', 'face-pulls'], science: 'La espalda necesita tracción horizontal (remos) para grosor y vertical (jalones/dominadas) para ancho. 15-20 series/semana.' },
            hombro: { name: 'Hombros', exercises: ['ohp', 'lateral-raise', 'face-pulls', 'rear-delt-fly', 'front-raise', 'cable-lateral'], science: 'El deltoides lateral es la clave para hombros anchos. 15-25 series/semana de laterales. El anterior ya trabaja en presses.' },
            pierna: { name: 'Piernas', exercises: ['squat', 'leg-press', 'romanian-deadlift', 'bulgarian-split', 'leg-extension', 'leg-curl', 'calf-raise'], science: 'Cuádriceps: ejercicios en estiramiento (sentadilla profunda, búlgara). Isquios: curl nórdico y RDL son los mejores.' },
            biceps: { name: 'Bíceps', exercises: ['barbell-curl', 'incline-curl', 'hammer-curl', 'preacher-curl', 'cable-curl'], science: 'El bíceps crece mejor con estiramiento (curl inclinado) y variando agarre. 10-15 series/semana directas.' },
            triceps: { name: 'Tríceps', exercises: ['close-grip-bench', 'overhead-extension', 'tricep-pushdown', 'dips', 'skull-crusher'], science: 'La cabeza larga del tríceps (la más grande) se trabaja mejor con overhead. 10-15 series/semana directas.' },
            gluteo: { name: 'Glúteos', exercises: ['hip-thrust', 'bulgarian-split', 'romanian-deadlift', 'squat', 'cable-kickback'], science: 'Hip thrust = mayor activación EMG de glúteo. Combinar con ejercicios en estiramiento (RDL, búlgara profunda).' },
            abdomen: { name: 'Core/Abdominales', exercises: ['hanging-leg-raise', 'cable-crunch', 'plank', 'russian-twist', 'ab-wheel'], science: 'Los abs se hacen en la cocina (deficit calórico). Para hipertrofia: ejercicios con carga progresiva, no 100 crunches.' }
        };

        let targetMuscle = null;
        for (const [key, data] of Object.entries(muscles)) {
            if (lowerPrompt.includes(key)) {
                targetMuscle = data;
                break;
            }
        }

        if (!targetMuscle) {
            targetMuscle = muscles.pecho; // default
        }

        const prs = Storage.getPRs();
        const isDeload = periodWeek.deload;
        const intensity = periodWeek.intensity;

        const exerciseDetails = targetMuscle.exercises.map(exId => {
            const ex = EXERCISES_DB.find(e => e.id === exId);
            if (!ex) return null;
            const pr = prs[exId];
            const suggestedWeight = pr ? Math.round(pr.weight * (intensity / 100)) : null;
            return { ...ex, suggestedWeight };
        }).filter(Boolean);

        return `💪 **Sesión de ${targetMuscle.name} - Máxima Efectividad**

📊 Semana ${Storage.getCurrentWeek()}/12 | RPE: ${periodWeek.rpe}
🧬 **Ciencia:** ${targetMuscle.science}
${isDeload ? '\n🟢 DELOAD: Reduce todo al 60% y haz 2 series menos por ejercicio.\n' : ''}

---

${exerciseDetails.slice(0, 6).map((ex, i) => `
**${i + 1}. ${ex.icon} ${ex.name}** ${i < 2 ? '⭐ PRIORITARIO' : ''}
   → ${isDeload ? ex.sets - 1 : ex.sets} series × ${ex.reps} reps
   ${ex.suggestedWeight ? `→ Peso: ~${ex.suggestedWeight}kg` : '→ Usa un peso que te desafíe a RPE ' + periodWeek.rpe}
   → Descanso: ${ex.rest}s
   → 💡 ${ex.tips.join(' | ')}
`).join('')}

---

**📋 Protocolo de ejecución:**
• Los 2 primeros ejercicios son COMPOUND → máximo esfuerzo (RPE ${periodWeek.rpe})
• Los demás son AISLAMIENTO → pump y conexión mente-músculo
• Última serie de cada ejercicio: técnica de intensidad (drop set, rest-pause o myo-reps)
${!isDeload ? '• Anota TODO: peso, reps, sensación. La próxima vez intenta +1 rep o +2.5kg' : ''}

**🔬 Tips avanzados para ${targetMuscle.name}:**
• Tempo: 2-1-2 (excéntrica-pausa-concéntrica) para máxima tensión
• Si un ejercicio no lo "sientes", baja peso y enfócate en el músculo
• Estira el músculo 60s entre series para hipertrofia extra

¿Quieres que ajuste algo? ¿Más volumen, menos tiempo, diferentes ejercicios?`;
    },

    generateExerciseAdvice(lowerPrompt, profile) {
        // Buscar qué ejercicio preguntan
        const exerciseMatch = EXERCISES_DB.find(ex => {
            const nameNorm = ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return lowerPrompt.includes(nameNorm) || lowerPrompt.includes(ex.id.replace(/-/g, ' '));
        });

        // Buscar qué músculo
        const muscleMap = { pecho: 'Pecho', espalda: 'Espalda', hombro: 'Hombros', pierna: 'Piernas', biceps: 'Bíceps', triceps: 'Tríceps', core: 'Core', abdomen: 'Core' };
        let targetMuscle = null;
        for (const [key, val] of Object.entries(muscleMap)) {
            if (lowerPrompt.includes(key)) { targetMuscle = val; break; }
        }

        if (exerciseMatch) {
            const pr = Storage.getPRs()[exerciseMatch.id];
            return `📚 **${exerciseMatch.name}** ${exerciseMatch.icon}

**Categoría:** ${exerciseMatch.category === 'compound' ? 'Compuesto (multi-articular) ⭐' : 'Aislamiento'}
**Músculo principal:** ${exerciseMatch.muscle}
**Equipamiento:** ${exerciseMatch.equipment}
**Dificultad:** ${exerciseMatch.difficulty}
${pr ? `**🏆 Tu PR:** ${pr.weight}kg` : ''}

**📋 Ejecución óptima:**
${exerciseMatch.description}

**✅ Claves de técnica:**
${exerciseMatch.tips.map(t => `• ${t}`).join('\n')}

**📊 Parámetros para hipertrofia:**
• Series: ${exerciseMatch.sets} (${exerciseMatch.category === 'compound' ? 'hasta 5 si priorizas este músculo' : '3-4 suficientes'})
• Repeticiones: ${exerciseMatch.reps}
• Descanso: ${exerciseMatch.rest}s ${exerciseMatch.category === 'compound' ? '(hasta 3 min si vas muy pesado)' : ''}
• Tempo: 2-0-1-0 (2s excéntrica, sin pausa, 1s concéntrica)

**🔬 ¿Qué dice la ciencia?**
${exerciseMatch.category === 'compound' ? 
'Los ejercicios compuestos son la BASE de cualquier programa. Reclutan más fibras musculares, permiten más carga y generan mayor respuesta hormonal. Priorízalos al inicio de la sesión.' :
'Los ejercicios de aislamiento son ideales al final de la sesión para "rematar" el músculo. Usa técnicas de intensidad (drop sets, myo-reps) aquí.'}

**🔄 Alternativas:**
${EXERCISES_DB.filter(e => e.muscle === exerciseMatch.muscle && e.id !== exerciseMatch.id).slice(0, 3).map(e => `• ${e.name} (${e.equipment})`).join('\n')}

¿Quieres que te explique la técnica con más detalle o te sugiera en qué parte de tu rutina ponerlo?`;
        }

        if (targetMuscle) {
            const muscleExercises = EXERCISES_DB.filter(e => e.muscle === targetMuscle);
            const ranked = muscleExercises.sort((a, b) => (a.category === 'compound' ? -1 : 1));

            return `🏆 **Mejores Ejercicios para ${targetMuscle} (por efectividad)**

Ranking basado en activación EMG, potencial de sobrecarga progresiva y practicidad:

${ranked.map((ex, i) => `
**${i + 1}. ${ex.icon} ${ex.name}** ${i < 2 ? '⭐ TOP' : ''}
   ${ex.category === 'compound' ? '🔴 Compound' : '🔵 Aislamiento'} | ${ex.equipment} | ${ex.sets}x${ex.reps}
   → ${ex.description.substring(0, 80)}...
`).join('')}

**💡 Recomendación para tu rutina:**
• Elige 2 compuestos + 2-3 aislamientos por sesión de ${targetMuscle}
• Total semanal óptimo: ${targetMuscle === 'Piernas' ? '15-20' : targetMuscle === 'Espalda' ? '15-20' : '10-18'} series directas
• Varía ejercicios cada 4-6 semanas para nuevo estímulo

¿Quieres que arme una sesión completa de ${targetMuscle} o te explique algún ejercicio en detalle?`;
        }

        return `📚 **Sobre Selección de Ejercicios**

Pregúntame específicamente y te ayudo:
• "¿Cuál es el mejor ejercicio para pecho?" → Te doy un ranking con ciencia
• "¿Cómo hago peso muerto?" → Te explico la técnica paso a paso
• "Alternativa a sentadilla" → Te doy opciones según tu equipamiento
• "Ejercicios para espalda ancha" → Te diseño una sesión completa

¿Qué músculo o ejercicio te interesa?`;
    },


    generateFullProgram(profile, periodWeek, lowerPrompt, prefs) {
        const days = profile.daysPerWeek || 4;
        const level = profile.level || 'intermedio';
        const goal = profile.goal || 'ganar músculo';
        const week = Storage.getCurrentWeek();

        let templateKey;
        // Si el usuario pide algo específico
        if (lowerPrompt.includes('ppl') || lowerPrompt.includes('push pull')) templateKey = 'ppl';
        else if (lowerPrompt.includes('upper') || lowerPrompt.includes('torso')) templateKey = 'upperLower';
        else if (lowerPrompt.includes('full body') || lowerPrompt.includes('cuerpo completo')) templateKey = 'fullBody';
        else if (lowerPrompt.includes('bro')) templateKey = 'bro';
        else {
            // Autoselección óptima
            if (days <= 3) templateKey = 'fullBody';
            else if (days === 4) templateKey = 'upperLower';
            else if (days === 5) templateKey = 'bro';
            else templateKey = 'ppl';
        }

        const template = ROUTINE_TEMPLATES[templateKey];

        return `📋 **Tu Programa Personalizado - ${template.name}**

👤 ${profile.name || 'Atleta'} | ${level} | ${goal}
📅 ${days} días/semana | ⏱️ ${template.duration}/sesión
📊 Semana ${week}/12 | Fase: ${periodWeek.phase}
${prefs.focusMuscles ? `🎯 Prioridad: ${prefs.focusMuscles}` : ''}

---

**¿Por qué ${template.name}?**
${templateKey === 'ppl' ? 'Con 6 días puedes trabajar cada músculo 2x/semana con volumen alto. Es el GOLD STANDARD para hipertrofia.' : 
templateKey === 'upperLower' ? 'Con 4 días consigues frecuencia 2x/semana por músculo con buen balance de volumen y recuperación. Ideal para tu disponibilidad.' :
templateKey === 'fullBody' ? 'Con 3 días, full body te da frecuencia 3x/semana por músculo. Los principiantes progresan BRUTAL con esto por las adaptaciones neurales.' :
'Con 5 días puedes destruir cada músculo con alto volumen. Para avanzados que necesitan mucho estímulo por grupo.'}

---

**📅 DISTRIBUCIÓN SEMANAL:**

${template.days.map((day, i) => {
    const exercises = day.exercises.map(exId => {
        const ex = EXERCISES_DB.find(e => e.id === exId);
        return ex ? `   • ${ex.name} - ${ex.sets}x${ex.reps}` : '';
    }).filter(Boolean).join('\n');
    return `
**Día ${i + 1}: ${day.name}**
${exercises}`;
}).join('\n')}

---

**⚡ Progresión Semanal (Fase: ${periodWeek.phase}):**
• Intensidad actual: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}
• ${periodWeek.deload ? '🟢 DELOAD esta semana: reduce peso al 60%, disfruta la recuperación' : `Intenta subir 2.5kg en compounds si completaste todas las reps la semana pasada`}
• Volumen: ${periodWeek.volume}

**🔑 Reglas inquebrantables:**
1. NUNCA faltes 2 días seguidos
2. Si no progresas en peso → añade 1 rep → luego 1 serie → luego cambia ejercicio
3. Come suficiente proteína (${Math.round((profile.weight || 70) * 2)}g/día)
4. Duerme 7-9h. Sin sueño no creces.
5. Cada 4-5 semanas: semana de deload

${prefs.deadline ? `\n📆 **Meta temporal: ${prefs.deadline}**\nCon tu programa actual y buena adherencia, ${goal.includes('perder') ? 'puedes perder 0.5-1kg/semana de forma sostenible' : 'puedes ganar 0.5-1kg de músculo/mes'}.` : ''}

¿Quieres que detalle algún día, cambie ejercicios, o ajuste el volumen?`;
    },

    generateTimelinePlan(lowerPrompt, profile, periodWeek) {
        const weight = profile.weight || 70;
        const goal = profile.goal || 'ganar músculo';
        const level = profile.level || 'intermedio';

        // Intentar extraer el plazo
        let weeks = 12;
        const monthMatch = lowerPrompt.match(/(\d+)\s*mes/);
        const weekMatch = lowerPrompt.match(/(\d+)\s*semana/);
        if (monthMatch) weeks = parseInt(monthMatch[1]) * 4;
        if (weekMatch) weeks = parseInt(weekMatch[1]);

        // Detectar eventos
        let event = '';
        if (lowerPrompt.includes('verano')) { event = 'el verano'; weeks = 16; }
        if (lowerPrompt.includes('boda')) event = 'la boda';
        if (lowerPrompt.includes('playa')) event = 'la playa';
        if (lowerPrompt.includes('vacacion')) event = 'las vacaciones';

        // Calcular resultados realistas
        let muscleGain, fatLoss, strengthGain;
        if (level === 'principiante') {
            muscleGain = (weeks / 4) * 0.8; // kg por mes
            fatLoss = (weeks / 4) * 2; // kg por mes en déficit
            strengthGain = '30-50%';
        } else if (level === 'intermedio') {
            muscleGain = (weeks / 4) * 0.4;
            fatLoss = (weeks / 4) * 1.5;
            strengthGain = '10-20%';
        } else {
            muscleGain = (weeks / 4) * 0.2;
            fatLoss = (weeks / 4) * 1.5;
            strengthGain = '5-10%';
        }

        return `📅 **Plan con Timeline: ${weeks} Semanas ${event ? 'para ' + event : ''}**

👤 ${profile.name || 'Atleta'} | ${weight}kg | ${level} | Objetivo: ${goal}

---

**📊 ¿Qué puedes lograr REALISTAMENTE en ${weeks} semanas?**

${goal.includes('perder') || goal.includes('definir') ? `
🔥 **Pérdida de grasa:** ${Math.round(fatLoss * 10) / 10}kg (a ${Math.round(fatLoss/weeks*7*100)/100}kg/semana)
💪 **Músculo:** Puedes mantener todo (o ganar ${level === 'principiante' ? '1-2kg' : 'algo'} si eres nuevo)
📏 **Cintura:** -${Math.round(weeks * 0.4)}cm aprox
🏋️ **Fuerza:** Se mantiene o sube ligeramente
👁️ **Visual:** Cambio NOTABLE a partir de semana ${Math.min(4, weeks)}
` : `
💪 **Ganancia muscular:** ${Math.round(muscleGain * 10) / 10}kg de músculo puro
🏋️ **Fuerza:** +${strengthGain} en los básicos (sentadilla, press, peso muerto)
📏 **Medidas:** +${Math.round(weeks * 0.15)}cm de brazo, +${Math.round(weeks * 0.3)}cm de pecho
⚖️ **Peso total:** +${Math.round(muscleGain * 1.5)}kg (algo de grasa incluida, normal)
👁️ **Visual:** La ropa te queda diferente desde semana 4-6
`}

---

**🗓️ PLAN POR FASES:**

**Fase 1 - Semanas 1-${Math.min(4, weeks)} (Adaptación/Inicio):**
• Aprender movimientos, crear hábito, progresión lineal
• ${goal.includes('perder') ? 'Déficit moderado: -300kcal' : 'Superávit ligero: +200kcal'}
• Espera: adaptación neural, DOMS iniciales, primeros cambios de fuerza

**Fase 2 - Semanas ${Math.min(5, weeks)}-${Math.min(8, weeks)} (Acumulación):**
• Subir volumen e intensidad gradualmente
• ${goal.includes('perder') ? 'Déficit: -400-500kcal' : 'Superávit: +250-350kcal'}
• Espera: cambios visibles empiezan, ropa queda diferente

${weeks > 8 ? `**Fase 3 - Semanas ${Math.min(9, weeks)}-${weeks} (Intensificación/Pico):**
• Máxima intensidad, técnicas avanzadas
• ${goal.includes('perder') ? 'Mantener déficit, incluir refeeds' : 'Mantener superávit, buscar PRs'}
• Espera: transformación notable, la gente pregunta "¿qué hiciste?"` : ''}

---

**⚡ ACCIONES INMEDIATAS (empieza HOY):**
1. ${goal.includes('perder') ? `Calorías: ${Math.round(weight * 26)}kcal/día` : `Calorías: ${Math.round(weight * 35)}kcal/día`}
2. Proteína: ${Math.round(weight * 2.2)}g/día SIN EXCEPCIÓN
3. Entrena ${profile.daysPerWeek || 4}x/semana, NUNCA faltes
4. Pésate 3x/semana y saca promedio
5. Fotos cada 2 semanas (misma luz, misma pose)
6. Duerme 7-9h CADA noche

**💡 Verdad incómoda:** El 90% del resultado depende de ADHERENCIA. No del programa perfecto. El programa que sigues consistentemente siempre gana.

¿Quieres que detalle el plan nutricional, la rutina específica, o ambos?`;
    },

    generateDetailedNutrition(lowerPrompt, profile) {
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const age = profile.age || 25;
        const gender = profile.gender || 'hombre';
        const goal = profile.goal || 'ganar músculo';

        // Mifflin-St Jeor
        let bmr;
        if (gender === 'hombre' || gender === 'masculino') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        const tdee = Math.round(bmr * 1.55); // Factor moderadamente activo

        let targetCals, protein, carbs, fats, strategy;
        if (goal.includes('perder') || goal.includes('definir') || goal.includes('bajar')) {
            targetCals = Math.round(tdee - 400);
            protein = Math.round(weight * 2.3);
            fats = Math.round(weight * 0.85);
            carbs = Math.round((targetCals - protein * 4 - fats * 9) / 4);
            strategy = 'Déficit calórico moderado (-400kcal). Proteína ALTA para preservar músculo.';
        } else if (goal.includes('ganar') || goal.includes('volumen') || goal.includes('musculo')) {
            targetCals = Math.round(tdee + 300);
            protein = Math.round(weight * 2);
            fats = Math.round(weight * 1);
            carbs = Math.round((targetCals - protein * 4 - fats * 9) / 4);
            strategy = 'Lean bulk (+300kcal). Superávit controlado para minimizar ganancia de grasa.';
        } else {
            targetCals = tdee;
            protein = Math.round(weight * 2);
            fats = Math.round(weight * 1);
            carbs = Math.round((targetCals - protein * 4 - fats * 9) / 4);
            strategy = 'Mantenimiento/recomposición. Come bien y entrena duro.';
        }

        // Detectar si pregunta algo específico
        if (lowerPrompt.includes('desayuno') || lowerPrompt.includes('que desayun')) {
            return this.generateMealIdeas('desayuno', protein, carbs, fats, targetCals, goal);
        }
        if (lowerPrompt.includes('almuerzo') || lowerPrompt.includes('que almuerz')) {
            return this.generateMealIdeas('almuerzo', protein, carbs, fats, targetCals, goal);
        }
        if (lowerPrompt.includes('cena') || lowerPrompt.includes('que cen')) {
            return this.generateMealIdeas('cena', protein, carbs, fats, targetCals, goal);
        }
        if (lowerPrompt.includes('pre entreno') || lowerPrompt.includes('pre-entreno') || lowerPrompt.includes('antes de entrenar')) {
            return this.generateMealIdeas('pre-entreno', protein, carbs, fats, targetCals, goal);
        }
        if (lowerPrompt.includes('post entreno') || lowerPrompt.includes('despues de entrenar')) {
            return this.generateMealIdeas('post-entreno', protein, carbs, fats, targetCals, goal);
        }

        return `🥗 **Plan Nutricional Completo y Personalizado**

👤 ${profile.name || 'Atleta'} | ${weight}kg | ${height}cm | ${age} años
🎯 Objetivo: ${goal}
📊 Estrategia: ${strategy}

---

**📐 TUS NÚMEROS (calculados con Mifflin-St Jeor):**
• BMR (metabolismo basal): ${Math.round(bmr)} kcal
• TDEE (gasto total): ${tdee} kcal
• 🎯 **Objetivo diario: ${targetCals} kcal**

**📊 MACRONUTRIENTES:**
| Macro | Gramos | Calorías | % |
|-------|--------|----------|---|
| 🥩 Proteína | **${protein}g** | ${protein * 4} kcal | ${Math.round(protein*4/targetCals*100)}% |
| 🍚 Carbos | **${carbs}g** | ${carbs * 4} kcal | ${Math.round(carbs*4/targetCals*100)}% |
| 🥑 Grasas | **${fats}g** | ${fats * 9} kcal | ${Math.round(fats*9/targetCals*100)}% |

---

**🍽️ DISTRIBUCIÓN EN 5 COMIDAS:**

**7:00 - Desayuno (~${Math.round(targetCals * 0.25)} kcal)**
→ 40g proteína + carbos complejos + fruta
• Opción A: 4 claras + 2 huevos + 80g avena + plátano
• Opción B: Yogur griego 250g + granola + frutas + 1 scoop whey
• Opción C: Tostadas integrales + aguacate + pavo + huevo

**10:30 - Snack (~${Math.round(targetCals * 0.12)} kcal)**
→ 25g proteína + grasas saludables
• 30g frutos secos + fruta + yogur griego
• O batido: whey + plátano + mantequilla de maní

**13:30 - Almuerzo (~${Math.round(targetCals * 0.30)} kcal)**
→ 50g proteína + carbos + verduras abundantes
• 200g pechuga/salmón/ternera + ${Math.round(carbs * 0.3)}g arroz (crudo) + ensalada grande + aceite oliva

**16:30 - Pre-entreno (~${Math.round(targetCals * 0.15)} kcal)**
→ 30g proteína + carbos rápidos
• Batido whey + plátano + 40g avena + miel
• O: pan + pavo + fruta

**20:30 - Cena (~${Math.round(targetCals * 0.18)} kcal)**
→ 40g proteína + verduras + grasas
• 180g pescado/pollo + verduras salteadas + ${goal.includes('perder') ? 'aguacate pequeño' : 'arroz/pasta + aceite'}

---

**💧 HIDRATACIÓN:** ${Math.round(weight * 0.035)}L/día mínimo (más en días de entreno)

**💡 REGLAS DE ORO:**
1. ${protein}g de proteína NO son negociables. Si un día no llegas → batido extra
2. Pesa tu comida la primera semana. Después ya "calibras" el ojo
3. Carbos más altos en días de entreno, más bajos en descanso
4. Vegetales en CADA comida principal (saciedad + micronutrientes)
5. 1-2 comidas "libres" a la semana no arruinan nada. Disfruta.

¿Quieres recetas específicas, lista de compras, o ideas para alguna comida?`;
    },

    generateMealIdeas(meal, protein, carbs, fats, totalCals, goal) {
        const meals = {
            'desayuno': {
                title: 'Ideas de Desayuno',
                cals: Math.round(totalCals * 0.25),
                options: [
                    { name: 'Power Oats', desc: '80g avena + 1 scoop whey + plátano + canela + nueces', macros: 'P:40g C:65g G:12g' },
                    { name: 'Huevos Champion', desc: '4 claras + 2 enteros + tostada integral + aguacate + tomate', macros: 'P:35g C:30g G:18g' },
                    { name: 'Bowl Griego', desc: '250g yogur griego + granola + frutos rojos + miel + semillas', macros: 'P:30g C:45g G:10g' },
                    { name: 'Pancakes Fitness', desc: '3 pancakes (avena+claras+plátano) + sirope sin azúcar + mantequilla maní', macros: 'P:35g C:55g G:15g' },
                    { name: 'Smoothie Beast', desc: 'Whey + plátano + avena + leche + mantequilla maní + cacao', macros: 'P:40g C:50g G:18g' }
                ]
            },
            'almuerzo': {
                title: 'Ideas de Almuerzo',
                cals: Math.round(totalCals * 0.30),
                options: [
                    { name: 'Pollo & Arroz Classic', desc: '200g pechuga + 100g arroz + brócoli + aceite oliva', macros: 'P:48g C:80g G:12g' },
                    { name: 'Bowl de Salmón', desc: '180g salmón + quinoa + aguacate + edamame + salsa soja', macros: 'P:42g C:55g G:22g' },
                    { name: 'Pasta Boloñesa Fit', desc: '100g pasta integral + 200g carne magra + salsa tomate + parmesano', macros: 'P:50g C:85g G:15g' },
                    { name: 'Tacos Proteicos', desc: '3 tortillas maíz + 200g ternera + pico de gallo + frijoles + guacamole', macros: 'P:45g C:60g G:18g' },
                    { name: 'Stir-fry Asiático', desc: '200g pollo + arroz + verduras mix + salsa teriyaki + sésamo', macros: 'P:45g C:75g G:10g' }
                ]
            },
            'cena': {
                title: 'Ideas de Cena',
                cals: Math.round(totalCals * 0.18),
                options: [
                    { name: 'Salmón Mediterráneo', desc: '180g salmón + ensalada grande + aceite oliva + limón', macros: 'P:38g C:10g G:18g' },
                    { name: 'Wrap de Pavo', desc: 'Tortilla integral + 150g pavo + hummus + verduras', macros: 'P:35g C:30g G:12g' },
                    { name: 'Revuelto Nocturno', desc: '4 huevos + espinacas + champiñones + queso feta + tostada', macros: 'P:32g C:20g G:22g' },
                    { name: 'Atún Bowl', desc: '200g atún + aguacate + pepino + arroz integral + soja', macros: 'P:42g C:35g G:15g' },
                    { name: 'Casein Pudding', desc: '1 scoop caseína + yogur griego + frutos rojos + dark chocolate', macros: 'P:40g C:25g G:8g' }
                ]
            },
            'pre-entreno': {
                title: 'Ideas Pre-Entreno (1-2h antes)',
                cals: Math.round(totalCals * 0.15),
                options: [
                    { name: 'Batido Express', desc: '1 scoop whey + plátano + 40g avena + miel', macros: 'P:30g C:55g G:5g' },
                    { name: 'Pan con Pavo', desc: '2 rebanadas pan + 100g pavo + plátano', macros: 'P:28g C:50g G:4g' },
                    { name: 'Rice Cakes Stack', desc: '3 tortitas de arroz + mantequilla maní + miel + plátano', macros: 'P:12g C:55g G:10g' },
                    { name: 'Bowl Energía', desc: 'Yogur + granola + plátano + miel', macros: 'P:20g C:60g G:8g' }
                ]
            },
            'post-entreno': {
                title: 'Ideas Post-Entreno (dentro de 2h)',
                cals: Math.round(totalCals * 0.20),
                options: [
                    { name: 'Shake Anabólico', desc: 'Whey + plátano + avena + leche + creatina', macros: 'P:40g C:60g G:8g' },
                    { name: 'Arroz & Pollo Express', desc: '150g pollo + arroz blanco + salsa + fruta', macros: 'P:38g C:70g G:8g' },
                    { name: 'Cereal Gains', desc: '80g cereal + leche + whey + plátano', macros: 'P:35g C:65g G:6g' }
                ]
            }
        };

        const mealData = meals[meal] || meals['desayuno'];
        return `🍽️ **${mealData.title} (~${mealData.cals} kcal)**

${mealData.options.map((opt, i) => `
**${i + 1}. ${opt.name}**
   📝 ${opt.desc}
   📊 ${opt.macros}
`).join('')}

💡 **Tips para ${meal}:**
${meal === 'desayuno' ? '• Come dentro de 1-2h de despertar\n• Incluye proteína + carbos complejos\n• Es la comida que te da energía para el día' :
meal === 'pre-entreno' ? '• Come 1-2h antes, no justo antes\n• Prioriza carbos simples + proteína\n• Evita mucha grasa (digestion lenta)\n• Si entrenas temprano, un batido rápido basta' :
meal === 'post-entreno' ? '• La "ventana anabólica" es 4-6h, no 30min\n• Prioriza proteína rápida (whey) + carbos\n• Es el mejor momento para carbos simples' :
'• Distribuye proteína uniformemente en todas las comidas\n• No te saltes comidas, mejor reduce porciones'}

¿Quieres más opciones, recetas detalladas, o ideas para otro momento del día?`;
    },


    generateDetailedAssessment(profile, periodWeek) {
        const weight = profile.weight || 70;
        const height = profile.height || 170;
        const age = profile.age || 25;
        const bmi = (weight / ((height/100) ** 2)).toFixed(1);
        const week = Storage.getCurrentWeek();
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const measurements = Storage.getMeasurements();
        const gender = profile.gender || 'hombre';

        // Calcular FFM estimado (si no tiene mucha grasa)
        const ffmi = bmi < 30 ? ((weight * (1 - 0.15)) / ((height/100)**2)).toFixed(1) : '?';

        // Fuerza relativa
        const benchPR = prs['bench-press'] ? prs['bench-press'].weight : 0;
        const squatPR = prs['squat'] ? prs['squat'].weight : 0;
        const deadliftPR = prs['deadlift'] ? prs['deadlift'].weight : 0;
        const total = benchPR + squatPR + deadliftPR;
        const wilks = total > 0 ? Math.round(total / weight * 100) : 0;

        // Consistencia
        const expectedWorkouts = week * (profile.daysPerWeek || 4);
        const adherence = expectedWorkouts > 0 ? Math.round(workouts.length / expectedWorkouts * 100) : 0;

        let strengthLevel;
        if (benchPR / weight > 1.5) strengthLevel = 'Avanzado';
        else if (benchPR / weight > 1.0) strengthLevel = 'Intermedio';
        else if (benchPR / weight > 0.7) strengthLevel = 'Principiante avanzado';
        else strengthLevel = 'Principiante';

        return `📊 **VALORACIÓN COMPLETA - ${profile.name || 'Atleta'}**

---

**📐 COMPOSICIÓN CORPORAL:**
• Peso: ${weight}kg | Altura: ${height}cm
• IMC: ${bmi} ${bmi < 18.5 ? '(bajo peso)' : bmi < 25 ? '(normal ✓)' : bmi < 30 ? '(sobrepeso)' : '(obesidad)'}
• FFMI estimado: ~${ffmi} ${parseFloat(ffmi) > 22 ? '(excelente desarrollo muscular)' : parseFloat(ffmi) > 20 ? '(buen desarrollo)' : '(hay mucho potencial de crecimiento)'}
• % Grasa estimado: ${bmi < 22 ? '10-14%' : bmi < 25 ? '14-18%' : bmi < 28 ? '18-24%' : '24%+'} (basado en IMC, una foto sería más precisa)

**🏋️ FUERZA (basado en PRs registrados):**
${benchPR > 0 || squatPR > 0 || deadliftPR > 0 ? `
• Press banca: ${benchPR > 0 ? benchPR + 'kg (' + (benchPR/weight).toFixed(2) + 'x peso corporal)' : 'Sin registrar'}
• Sentadilla: ${squatPR > 0 ? squatPR + 'kg (' + (squatPR/weight).toFixed(2) + 'x peso corporal)' : 'Sin registrar'}
• Peso muerto: ${deadliftPR > 0 ? deadliftPR + 'kg (' + (deadliftPR/weight).toFixed(2) + 'x peso corporal)' : 'Sin registrar'}
• Total: ${total}kg | Ratio fuerza/peso: ${wilks}%
• **Nivel de fuerza: ${strengthLevel}**

📏 Estándares (${gender === 'hombre' ? 'hombres' : 'mujeres'}):
   Bench: 1.25x = intermedio, 1.5x = avanzado
   Squat: 1.5x = intermedio, 2x = avanzado
   Deadlift: 1.75x = intermedio, 2.5x = avanzado` :
'❗ No tienes PRs registrados aún. Empieza a entrenar con la app para trackear tu progreso.'}

**📈 ADHERENCIA AL PROGRAMA:**
• Semana: ${week}/12
• Entrenamientos completados: ${workouts.length}/${expectedWorkouts} esperados
• Adherencia: **${adherence}%** ${adherence >= 80 ? '🟢 Excelente' : adherence >= 60 ? '🟡 Buena, puedes mejorar' : '🔴 Baja, necesitas más consistencia'}
${measurements.length > 1 ? `
**📏 CAMBIOS EN MEDIDAS:**
• Peso inicial → actual: ${measurements[0].weight || '?'}kg → ${measurements[measurements.length-1].weight || weight}kg
${measurements[0].bodyFat && measurements[measurements.length-1].bodyFat ? `• % Grasa: ${measurements[0].bodyFat}% → ${measurements[measurements.length-1].bodyFat}%` : ''}` : ''}

---

**🎯 PLAN DE ACCIÓN (próximas 4 semanas):**

${profile.goal && profile.goal.includes('perder') ? `
1. **Nutrición:** ${Math.round(weight * 26)} kcal/día con ${Math.round(weight * 2.2)}g proteína
2. **Entreno:** Mantén intensidad, reduce volumen ligeramente
3. **Cardio:** Añade 3-4 sesiones de 20-30min LISS
4. **Peso objetivo 4 semanas:** ~${(weight - 2).toFixed(1)}kg (-2kg)
` : `
1. **Nutrición:** ${Math.round(weight * 34)} kcal/día con ${Math.round(weight * 2)}g proteína
2. **Entreno:** Progresión en todos los compuestos +2.5kg/semana
3. **Volumen:** Aumenta 1-2 series/músculo/semana si te recuperas bien
4. **Peso objetivo 4 semanas:** ~${(weight + 1.5).toFixed(1)}kg (+1.5kg lean)
`}

📸 **Para una valoración VISUAL precisa**, envíame una foto de frente y lateral. Puedo estimar tu % grasa y señalar puntos fuertes/débiles específicos.

¿Algo que quieras que profundice?`;
    },

    generateDetailedProgress(profile) {
        const workouts = Storage.getWorkoutHistory();
        const measurements = Storage.getMeasurements();
        const prs = Storage.getPRs();
        const week = Storage.getCurrentWeek();

        const last7 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7*24*60*60*1000));
        const last30 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 30*24*60*60*1000));

        const weekVolume = last7.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
        const monthVolume = last30.reduce((sum, w) => sum + (w.totalVolume || 0), 0);

        const prList = Object.entries(prs).map(([id, data]) => {
            const ex = EXERCISES_DB.find(e => e.id === id);
            return { name: ex ? ex.name : id, weight: data.weight, date: data.date };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        return `📈 **REPORTE DE PROGRESO DETALLADO**

📅 Semana ${week}/12 | ${profile.name || 'Atleta'}

---

**📊 RESUMEN DE ACTIVIDAD:**
• Total histórico: ${workouts.length} entrenamientos
• Últimos 7 días: ${last7.length} sesiones (${last7.length >= (profile.daysPerWeek || 4) ? '✅ objetivo cumplido' : '⚠️ falta consistencia'})
• Últimos 30 días: ${last30.length} sesiones
• Volumen semanal: ${weekVolume > 1000 ? (weekVolume/1000).toFixed(1) + 'k' : weekVolume}kg
• Volumen mensual: ${monthVolume > 1000 ? (monthVolume/1000).toFixed(1) + 'k' : monthVolume}kg

**🏆 PRs RECIENTES:**
${prList.length > 0 ? prList.slice(0, 5).map(pr => `• ${pr.name}: **${pr.weight}kg** (${Helpers.formatDate(pr.date)})`).join('\n') : '• Aún sin PRs registrados'}

${measurements.length > 0 ? `
**⚖️ EVOLUCIÓN DE PESO:**
${measurements.slice(-5).map(m => `• ${Helpers.formatDate(m.date)}: ${m.weight}kg ${m.bodyFat ? '| ' + m.bodyFat + '% grasa' : ''}`).join('\n')}
${measurements.length >= 2 ? `\n📐 Cambio total: ${((measurements[measurements.length-1].weight || 0) - (measurements[0].weight || 0)).toFixed(1)}kg` : ''}
` : ''}

---

**💡 ANÁLISIS:**
${workouts.length === 0 ? 
`¡Aún no has empezado! El mejor momento para plantar un árbol fue hace 20 años. El segundo mejor momento es AHORA. Ve a Rutinas y empieza tu primer entrenamiento.` :
workouts.length < 5 ?
`Estás empezando. Los primeros entrenamientos son los más importantes porque crean el HÁBITO. No te preocupes por pesos, enfócate en no faltar. En 2-3 semanas ya verás fuerza nueva.` :
workouts.length < 15 ?
`Buen progreso. Ya pasaste la fase más difícil (empezar). Ahora enfócate en progresión: intenta subir peso o reps CADA semana. Tu cuerpo está respondiendo.` :
`¡Excelente consistencia! Con ${workouts.length} entrenamientos ya tienes una base sólida. ${weekVolume > 10000 ? 'Tu volumen es alto, asegúrate de recuperar bien.' : 'Busca subir el volumen total gradualmente para seguir creciendo.'}`}

**🎯 OBJETIVOS PARA LA PRÓXIMA SEMANA:**
1. ${last7.length < (profile.daysPerWeek || 4) ? 'Completa todas tus ' + (profile.daysPerWeek || 4) + ' sesiones' : 'Mantén tu adherencia perfecta'}
2. Intenta superar al menos 1 PR
3. Registra tu peso 3 veces (mañana, en ayunas)
4. ${profile.goal && profile.goal.includes('perder') ? 'Mantén el déficit calórico sin saltarte comidas' : 'Come suficiente, especialmente proteína post-entreno'}

¿Quieres ver algo más específico o que te ajuste el plan?`;
    },

    generateInjuryAdvice(lowerPrompt, profile) {
        let area = 'general';
        if (lowerPrompt.includes('hombro')) area = 'hombro';
        else if (lowerPrompt.includes('rodilla')) area = 'rodilla';
        else if (lowerPrompt.includes('espalda') || lowerPrompt.includes('lumbar')) area = 'espalda';
        else if (lowerPrompt.includes('muñeca') || lowerPrompt.includes('muneca')) area = 'muñeca';
        else if (lowerPrompt.includes('codo')) area = 'codo';

        const adviceMap = {
            hombro: {
                title: 'Hombro',
                common: 'Impingement/pinzamiento, tendinitis del manguito rotador, inestabilidad',
                avoid: 'Press militar detrás del cuello, aperturas muy abiertas, dips muy profundos',
                replace: 'Usa mancuernas en vez de barra (más libertad de movimiento), landmine press, press con agarre neutro',
                rehab: 'Face pulls diarios (3x15), rotaciones externas con banda, dislocaciones con palo, movilidad CARS',
                rule: 'Si duele DURANTE el ejercicio → para inmediatamente. Si duele DESPUÉS → reduce peso 50% por 2 semanas.'
            },
            rodilla: {
                title: 'Rodilla',
                common: 'Tendinitis rotuliana, síndrome patelofemoral, menisco',
                avoid: 'Sentadillas con rebote, extensión de piernas con mucho peso, saltar con peso',
                replace: 'Sentadilla a caja (box squat), leg press con ROM controlado, step-ups, isométricos de cuádriceps',
                rehab: 'Sentadilla isométrica en pared 3x30s, VMO con mini-banda, foam roller en cuádriceps e IT band',
                rule: 'El dolor de rodilla suele mejorar con movimiento CONTROLADO, no con descanso total. Reduce peso pero sigue moviendo.'
            },
            espalda: {
                title: 'Espalda baja/Lumbar',
                common: 'Hernia discal, protrusión, espasmo muscular, ciática',
                avoid: 'Peso muerto con espalda redondeada, good mornings pesados, crunches (comprimen discos)',
                replace: 'Hip hinge con kettlebell, RDL con ROM reducido, bird dog, pallof press, dead bug',
                rehab: 'McGill Big 3 (curl-up, side plank, bird dog), cat-cow, glute bridges, paseos suaves',
                rule: 'La espalda baja ODIA la flexión bajo carga. Mantén core activado SIEMPRE. Bracing > cinturón.'
            },
            muñeca: {
                title: 'Muñeca',
                common: 'Tendinitis, TFCC, síndrome de De Quervain',
                avoid: 'Front squats con agarre completo, curls con barra recta (usa Z), push-ups con muñecas planas',
                replace: 'Usa wrist wraps, barra EZ para curls, push-ups en puños o parallettes, agarre neutro cuando sea posible',
                rehab: 'Extensiones de muñeca con banda ligera, flexiones/extensiones con peso leve, rice bucket',
                rule: 'Usa wrist wraps en ejercicios pesados. Calienta muñecas 2-3min antes de entrenar.'
            },
            codo: {
                title: 'Codo',
                common: 'Epicondilitis (codo de tenista), epitrocleitis (codo de golfista)',
                avoid: 'Curls muy pesados con mala forma, extensiones de tríceps agresivas, demasiado volumen de brazos',
                replace: 'Reduce frecuencia de bíceps/tríceps, usa bandas, excéntricos lentos con peso bajo',
                rehab: 'Wrist curls excéntricos, tyler twist con theraband, masaje profundo en antebrazo',
                rule: 'Los problemas de codo suelen venir de DEMASIADO volumen de brazos. Reduce series totales de bíceps + tríceps.'
            },
            general: {
                title: 'General',
                common: 'Dolor muscular (DOMS), pinzamientos, tendinitis',
                avoid: 'Cualquier ejercicio que cause dolor AGUDO (no confundir con molestia muscular)',
                replace: 'Busca variaciones que no duelan. Casi siempre hay una alternativa sin dolor.',
                rehab: 'Movilidad diaria 10min, foam roller, calentamiento progresivo, sueño de calidad',
                rule: 'DOLOR ≠ DOMS. El DOMS es difuso y dura 24-72h. El dolor de lesión es localizado, agudo y empeora con el movimiento.'
            }
        };

        const advice = adviceMap[area];
        return `🏥 **Guía: Dolor/Molestia en ${advice.title}**

⚠️ **DISCLAIMER:** Esto NO reemplaza a un fisioterapeuta. Si el dolor es intenso, persistente (>2 semanas) o limita tu día a día, ve a un profesional.

---

**🔍 Problemas comunes:** ${advice.common}

**❌ EVITA:**
${advice.avoid}

**✅ REEMPLAZA CON:**
${advice.replace}

**🔄 REHABILITACIÓN/PREVENCIÓN:**
${advice.rehab}

**📏 REGLA DE ORO:**
${advice.rule}

---

**📋 PROTOCOLO DE VUELTA AL ENTRENO:**
1. **Semana 1-2:** Solo movimientos sin dolor, peso 40-50%, enfócate en rehab
2. **Semana 3-4:** Aumenta gradualmente a 70%, añade ejercicios uno a uno
3. **Semana 5+:** Vuelta a la normalidad si no hay dolor

**💡 Tips generales:**
• Calentar SIEMPRE 10min antes de entrenar (cardio + movilidad articular)
• El dolor "bueno" es muscular y difuso. El dolor "malo" es articular y agudo.
• Si algo duele → baja peso → cambia ángulo → cambia ejercicio → descansa ese músculo
• Hielo 15min post-entreno si hay inflamación
• Anti-inflamatorios solo si es necesario y por corto tiempo

¿Quieres que te diseñe una rutina adaptada a tu molestia?`;
    },


    generateDetailedSupplements(profile, lowerPrompt) {
        const weight = profile.weight || 70;

        if (lowerPrompt.includes('creatina')) {
            return `💎 **TODO sobre Creatina Monohidrato**

La creatina es EL suplemento más estudiado y más efectivo que existe para rendimiento y músculo.

**📊 ¿Qué hace?**
• Aumenta la fosfocreatina muscular → más ATP → más fuerza y reps
• Mejora la recuperación entre series
• Aumenta el volumen celular (cell swelling → señal anabólica)
• Beneficios cognitivos comprobados

**📏 DOSIS:** 5g/día. TODOS los días. Así de simple.

**❓ Preguntas frecuentes:**
• **¿Fase de carga?** NO necesaria. 5g/día durante 3-4 semanas y ya estás saturado.
• **¿Cuándo tomarla?** Da igual. Con la comida, en el batido, cuando quieras. La consistencia importa más.
• **¿Retiene líquidos?** Sí, 1-3kg de agua INTRAMUSCULAR (te ves más lleno, no hinchado). Es bueno.
• **¿Es segura?** SÍ. Es el suplemento más estudiado de la historia. Sin efectos adversos a largo plazo.
• **¿Hay que ciclarla?** NO. Úsala indefinidamente.
• **¿Cuál comprar?** Creatina monohidrato en polvo. No necesitas "creapure" ni versiones fancy. La más barata funciona igual.
• **¿Se pierde pelo?** NO hay evidencia sólida. Un estudio sugirió aumento de DHT pero nunca se replicó.
• **¿Afecta los riñones?** NO si tienes riñones sanos. Bebe suficiente agua.

**💰 Costo-beneficio:** ~$15-20/mes por +5-10% de rendimiento. El suplemento con mejor ROI que existe.

**Dosis para ti:** 5g/día (${weight}kg). No necesitas más.`;
        }

        if (lowerPrompt.includes('pre-entreno') || lowerPrompt.includes('pre entreno')) {
            return `⚡ **Pre-Entrenos: Guía Completa**

**¿Necesitas un pre-entreno?** Probablemente NO. Un café + plátano funciona igual de bien.

**📊 Ingredientes que SÍ funcionan (y dosis efectiva):**
1. **Cafeína:** 3-6mg/kg → Para ti: ${Math.round(weight * 4)}mg (equivale a ~${Math.round(weight * 4 / 80)} cafés)
   • Mejora fuerza, resistencia y focus
   • No tomes después de las 14:00 (afecta sueño)
   • Desarrollas tolerancia → haz breaks de 1-2 semanas

2. **Citrulina malato:** 6-8g → Mejora pump y resistencia muscular
3. **Beta-alanina:** 3-5g → El "hormigueo". Mejora resistencia en series largas
4. **Creatina:** 5g → Ya sabes
5. **Tirosina:** 500-2000mg → Focus mental

**❌ Ingredientes INÚTILES que meten en pre-entrenos:**
• Blend propietario (esconden las dosis)
• BCAAs (ya tienes en la proteína)
• Dosis sub-clínicas de todo

**🏆 Opciones:**
1. **Hacerlo tú mismo:** Cafeína + Citrulina + Creatina en polvo. Más barato y sabes lo que tomas.
2. **Comprado:** Busca uno con dosis transparentes de al menos cafeína 200-300mg + citrulina 6g
3. **El clásico:** 1-2 cafés + plátano 30min antes. Simple y efectivo.

**⚠️ Reglas:**
• No dependas del pre-entreno. Si no puedes entrenar sin él, estás durmiendo mal o comiendo mal.
• Cicla la cafeína: 8 semanas on, 1-2 off
• NUNCA más de 400mg cafeína/día`;
        }

        return `💊 **Guía Completa de Suplementación para ${profile.name || 'Atleta'} (${weight}kg)**

Basada en evidencia científica. Ordenada por importancia REAL:

---

**TIER 1 - IMPRESCINDIBLES (evidencia nivel A):**

1. **💎 Creatina Monohidrato** — 5g/día SIEMPRE
   • +5-10% fuerza | +1-2kg músculo en 12 semanas | ~$15/mes
   • El suplemento más efectivo que existe, punto.

2. **🥤 Proteína Whey** — ${Math.round(weight * 0.5)}g/día (si no llegas con comida)
   • NO es mágica, es simplemente proteína conveniente
   • Tu objetivo: ${Math.round(weight * 2)}g proteína total/día. Si llegas con comida, no la necesitas.
   • Post-entreno o cuando quieras completar macros.

3. **☀️ Vitamina D3** — 2000-4000 IU/día
   • 70%+ de la población es deficiente
   • Impacta testosterona, inmunidad, mood, rendimiento
   • Tómala con comida (grasa) para mejor absorción

---

**TIER 2 - MUY ÚTILES (evidencia nivel B):**

4. **😴 Magnesio (Glicinato)** — 400mg antes de dormir
   • Mejora calidad de sueño (y sin sueño no creces)
   • Reduce calambres y mejora recuperación

5. **🐟 Omega-3 (EPA/DHA)** — 2-3g/día
   • Antiinflamatorio, salud cardiovascular, articular
   • Busca mínimo 1g EPA + 1g DHA combinados

6. **☕ Cafeína** — ${Math.round(weight * 4)}mg pre-entreno
   • +5-10% rendimiento comprobado
   • Tómala 30-60min antes del gym

---

**TIER 3 - OPCIONALES (ayudan un poquito):**

7. Beta-Alanina — 3-5g/día (para sets de >10 reps)
8. Citrulina — 6-8g pre-entreno (pump y resistencia)
9. Zinc — 15-30mg si sudas mucho o tienes déficit
10. Ashwagandha — 600mg/día (reduce cortisol, mejora recuperación)

---

**❌ NO MALGASTES EN:**
• BCAAs/EAAs → Ya los tienes en whey y comida
• Quemadores de grasa → Marketing. El déficit calórico es gratis
• Boosters de testosterona → No funcionan (tribulus, etc.)
• Glutamina → Inútil si comes suficiente proteína
• Multivitamínico → Come verduras, es mejor y más barato

---

**💰 Budget mensual realista:** ~$50-70 (creatina + whey + vitamina D + magnesio)
**💡 Prioridad:** Sueño > Nutrición > Entreno > Suplementos

Los suplementos son el ÚLTIMO 5% de tus resultados. El 95% es entreno consistente, nutrición adecuada y sueño.

¿Tienes dudas sobre alguno en específico?`;
    },

    generateCardioAdvice(profile, lowerPrompt) {
        const weight = profile.weight || 70;
        const goal = profile.goal || 'ganar músculo';
        const isDeficit = goal.includes('perder') || goal.includes('definir');

        return `🫀 **Guía de Cardio para ${isDeficit ? 'Definición' : 'Ganancia Muscular'}**

**📊 Tu situación:** ${weight}kg | Objetivo: ${goal}
${isDeficit ? '→ El cardio es tu ALIADO para aumentar el déficit sin bajar más calorías' : '→ El cardio debe ser MÍNIMO para no interferir con la hipertrofia'}

---

**🚶 LISS (Low Intensity Steady State) - RECOMENDADO:**
• ${isDeficit ? '4-5 sesiones/semana' : '2-3 sesiones/semana'} de 20-40 min
• Caminar rápido, bicicleta suave, elíptica
• FC: 120-140 bpm (puedes hablar sin dificultad)
• Quema: ~${Math.round(weight * 0.06 * 30)} kcal/sesión de 30min
• ✅ NO interfiere con la recuperación muscular
• Hazlo en días de descanso o post-entreno de pesas

**⚡ HIIT (High Intensity Interval Training):**
• ${isDeficit ? '1-2 sesiones/semana MÁXIMO' : '0-1 sesiones/semana'}
• 15-20 min: 30s sprint / 60s descanso
• Sprints, burpees, remo, bici, battle ropes
• Quema más en menos tiempo PERO es muy demandante
• ⚠️ No hacer el mismo día que piernas pesadas

**📊 RECOMENDACIÓN SEMANAL:**
${isDeficit ? `
• Lunes: Pesas + 15min LISS post
• Martes: Pesas + 15min LISS post
• Miércoles: 30min LISS (caminar rápido)
• Jueves: Pesas + 15min LISS post
• Viernes: Pesas + 15min LISS post
• Sábado: 20min HIIT O 40min caminata
• Domingo: Descanso activo (paseo)
• **Total: ~150-200min cardio/semana → quema extra de ~800-1200 kcal**
` : `
• Solo 2-3 caminatas de 20-30min en días off
• 8000-10000 pasos diarios
• NO hagas HIIT si ya entrenas pesas 4-5x/semana
• El cardio excesivo = menos recuperación = menos músculo
• **Total: ~60-90min/semana es suficiente**
`}

**💡 EL HACK DEFINITIVO:**
En vez de 30min de cardio, simplemente **camina más durante el día:**
• 10.000 pasos/día = ~400 kcal extra quemadas
• Sube escaleras, camina al trabajo, pasea después de comer
• Es más sostenible y no te cansa para el gym

**❌ ERRORES:**
• Cardio excesivo en volumen → pierdes músculo y rendimiento
• Cardio ANTES de pesas → peor rendimiento con los hierros
• Compensar mala dieta con cardio → nunca funciona
• HIIT diario → sobreentrenamiento seguro

¿Necesitas un plan más específico?`;
    },

    generateDetailedRecovery(profile, periodWeek) {
        const weight = profile.weight || 70;
        const isDeload = periodWeek.deload;

        return `😴 **GUÍA DE RECUPERACIÓN ÓPTIMA**

La recuperación es donde tu cuerpo CRECE. Entrenas para estimular, comes para construir, duermes para crecer. Sin recovery = sin gains.

---

${isDeload ? `
🟢 **ESTÁS EN SEMANA DE DELOAD**
Esta semana es ESPECIALMENTE importante para recovery:
• Reduce peso al 55-60% de tu máximo
• Haz solo 2 series por ejercicio
• No llegues al fallo en ninguna serie
• Duerme más de lo normal
• Come en mantenimiento (no en déficit)
• Tu cuerpo se está reparando y adaptando
\n---\n` : ''}

**🌙 SUEÑO (Factor #1 - representa el 30% de tus resultados):**
• **Duración:** 7-9 horas. Sin negociar. Punto.
• **Consistencia:** Misma hora TODOS los días (±30min)
• **Ambiente:** Cuarto oscuro total, 18-20°C, sin ruido
• **Pre-sueño:** Sin pantallas 45-60min antes (o usa filtro azul)
• **Suplementos:** Magnesio 400mg + Ashwagandha 600mg antes de dormir

📊 **Por qué importa:** Con <6h de sueño pierdes 60% de la capacidad de síntesis proteica. Literalmente es imposible crecer bien sin dormir bien.

**🍽️ NUTRICIÓN PARA RECOVERY:**
• Proteína: ${Math.round(weight * 2)}g distribuidos en 4-5 tomas (cada 3-4h)
• Post-entreno: 30-40g proteína rápida (whey) + carbohidratos
• Antes de dormir: 30-40g caseína o yogur griego (proteína lenta, 7h sin comer)
• Hidratación: ${Math.round(weight * 0.04)}L/día (más en días de entreno)
• Carbohidratos: reponor glucógeno POST-entreno es clave

**🧘 RECUPERACIÓN ACTIVA:**
• Caminar 20-30min (mejora flujo sanguíneo sin estrés muscular)
• Foam rolling 5-10min en músculos entrenados
• Estiramientos LIGEROS (no agresivos post-entreno)
• Yoga/mobility 1-2x semana
• Sauna/baño caliente (relaja y mejora circulación)

**❄️ ESTRATEGIAS AVANZADAS:**
• Ducha fría 2-3min post-entreno (reduce inflamación aguda)
• Contrast showers (alternar frío/caliente)
• Massage gun en puntos de tensión
• Meditación/respiración 5-10min (reduce cortisol)

---

**⚠️ SEÑALES DE QUE NECESITAS MÁS RECOVERY:**
• Rendimiento baja 2+ sesiones seguidas
• Te sientes débil/cansado al despertar
• Apetito baja o sube mucho
• Irritabilidad constante
• Tardes en dormirte
• Dolor articular (no muscular)
• Enfermarte frecuentemente

**🆘 Si estás sobreentrenado:**
1. Toma 3-5 días de descanso TOTAL
2. Come en mantenimiento o superávit
3. Duerme 9+ horas
4. Cero estrés extra
5. Vuelve gradualmente al 60% de tu intensidad normal

**💡 REGLA SIMPLE:** Si dudas entre entrenar o descansar → DESCANSA. Un día más de recuperación nunca arruina nada. Un día de sobreentrenamiento puede costarte una semana.`;
    },

    generateMotivation(profile) {
        const workouts = Storage.getWorkoutHistory().length;
        const week = Storage.getCurrentWeek();
        const name = profile.name || 'crack';

        const motivations = [
            `🔥 **${name}, escucha esto:**

El gym no se trata de motivación. La motivación es una mentira que te venden en Instagram.

Se trata de DISCIPLINA. De IDENTIDAD. De ser la persona que va al gym sin importar cómo se siente.

¿Sabes cuántas veces los atletas de élite no quieren entrenar? TODOS los días. La diferencia es que van igual.

**La regla de los 5 minutos:** Solo comprométete a ir y calentar 5 minutos. Si después quieres irte, te vas. (Spoiler: en toda la historia de esta regla, NADIE se ha ido después de calentar)

📊 Dato real: Tienes ${workouts} entrenamientos completados. Cada uno de ellos es una prueba de que PUEDES. No empieces de cero, empieza desde donde estás.

**Tu yo de dentro de 3 meses** te agradecerá CADA sesión que hagas hoy. Incluso la más corta. Incluso la más mediocre. Porque la consistencia > la perfección.

💪 Ahora ve, ponte los tenis, y haz la primera serie. El resto fluye solo.`,

            `⚡ **${name}, la verdad incómoda:**

Nadie que valga la pena tuvo un físico así por "cuando le daban ganas".

Las 5am en invierno. Los días de pierna cuando duele todo. Las comidas "aburridas" que prepares. ESO es lo que construye el físico que quieres.

📈 **Los números no mienten:**
• Ya llevas ${workouts} entrenos y ${week} semanas
• El 92% de la gente abandona antes de la semana 8
• TÚ sigues aquí. Eso ya te pone en el top 8%

**Hack mental:** No pienses "tengo que entrenar". Piensa "ELIJO entrenar". Tú eliges ser esta versión de ti mismo.

🎯 **Tu plan para hoy:**
1. Pon tu playlist más agresiva
2. Haz el calentamiento
3. Primera serie del primer ejercicio
4. El momentum hace el resto

La disciplina es un músculo. Y tú lo estás entrenando cada vez que vas sin ganas.

💪 Ahora deja el teléfono y ve a levantar hierro.`,

            `💪 **${name}, piensa en esto:**

Dentro de 90 días, VAS a existir de todas formas. La pregunta es: ¿vas a ser la misma versión de hoy? ¿O la versión que entrena, come bien y se transforma?

El dolor de la disciplina pesa gramos. El dolor del arrepentimiento pesa TONELADAS.

📊 **Perspectiva:**
• 12 semanas = 84 días
• 1 hora de gym = 4% de tu día
• 4-5x/semana = menos de 5 horas (de 168 que tiene la semana)

Tienes el tiempo. Lo que te falta no es motivación, es DECISIÓN. Decide ser esa persona y actúa como ella actuaría.

**La persona que quieres ser... ¿se quedaría hoy en el sofá?** No.

🔥 Ve al gym. Aunque sea 30 minutos. Aunque sea suave. Porque el HÁBITO importa más que la intensidad.

Pd: Nadie se arrepiente después de entrenar. NUNCA.`
        ];

        return motivations[Math.floor(Math.random() * motivations.length)];
    },


    generateComparison(lowerPrompt, profile) {
        // Detectar qué se compara
        if (lowerPrompt.includes('mancuerna') && (lowerPrompt.includes('barra') || lowerPrompt.includes('vs'))) {
            return `⚖️ **Barra vs Mancuernas**

| Aspecto | Barra | Mancuernas |
|---------|-------|------------|
| Carga máxima | ✅ Mayor peso posible | ❌ Limitadas |
| Rango de movimiento | ❌ Fijo | ✅ Mayor libertad |
| Estabilización | ❌ Menos | ✅ Más (más fibras) |
| Simetría | ❌ Lado dominante compensa | ✅ Trabaja independiente |
| Seguridad (solo) | ❌ Necesitas rack/spotter | ✅ Puedes soltar |
| Progresión | ✅ Más fácil (2.5kg) | ❌ Saltos de 2-4kg |

**Veredicto:** Usa AMBOS. Barra para los básicos pesados (bench, squat, deadlift). Mancuernas para accesorios y variación.

**Para hipertrofia:** Las mancuernas pueden ser MEJORES porque permiten mayor estiramiento y rango. El press con mancuernas activa más pecho que el press con barra según EMG.

**Mi recomendación para ti:**
• Compuestos pesados → Barra (progresión más fácil)
• Accesorios → Mancuernas (más estímulo, menos riesgo)
• Varía cada 4-6 semanas para nuevo estímulo`;
        }

        if (lowerPrompt.includes('maquina') && (lowerPrompt.includes('peso libre') || lowerPrompt.includes('libre'))) {
            return `⚖️ **Peso Libre vs Máquinas**

| Aspecto | Peso Libre | Máquinas |
|---------|-----------|----------|
| Activación muscular | ✅ Mayor (estabilizadores) | ❌ Menor |
| Seguridad | ❌ Requiere técnica | ✅ Guiado |
| Aislamiento | ❌ Difícil aislar | ✅ Excelente |
| Progresión | ✅ Infinita | ✅ Fácil |
| Funcionalidad | ✅ Transferencia real | ❌ Movimiento fijo |
| Lesión/dolor | ❌ Más riesgo si no hay técnica | ✅ Más seguro |

**Veredicto para tu programa:**
• 60-70% peso libre (la BASE de tu entrenamiento)
• 30-40% máquinas (para aislar y rematar sin fatiga del SNC)

**Pro tip:** Empieza con compuestos libres cuando estás fresco, termina con máquinas cuando estás cansado. Lo mejor de ambos mundos.`;
        }

        if (lowerPrompt.includes('volumen') || lowerPrompt.includes('definicion') || lowerPrompt.includes('bulk') || lowerPrompt.includes('cut')) {
            const weight = profile.weight || 70;
            return `⚖️ **¿Volumen o Definición? (Bulk vs Cut)**

📊 **Tu situación actual:** ${weight}kg | IMC: ${(weight / ((profile.height || 175)/100)**2).toFixed(1)}

**¿Cuándo hacer VOLUMEN (bulk)?**
• Si estás <15% grasa corporal (se ven abdominales)
• Si eres principiante (los noob gains compensan la grasa)
• Si ya llevas +6 semanas en déficit
• Superávit: +200-350 kcal → ${Math.round(weight * 34)}-${Math.round(weight * 36)} kcal/día

**¿Cuándo hacer DEFINICIÓN (cut)?**
• Si estás >18-20% grasa (no se ven abdominales)
• Si llevas +4 meses en volumen
• Si te ves "hinchado" y quieres verte mejor
• Déficit: -300-500 kcal → ${Math.round(weight * 24)}-${Math.round(weight * 27)} kcal/día

**¿Cuándo RECOMPOSICIÓN?**
• Si eres principiante (ganas músculo y pierdes grasa a la vez)
• Si vuelves después de un parón
• Come en mantenimiento con proteína alta: ${Math.round(weight * 2.2)}g/día

**Mi recomendación para ti:**
${(weight / ((profile.height || 175)/100)**2) > 25 ? '→ Empieza con un CUT moderado de 8-12 semanas, luego pasa a lean bulk.' : 
(weight / ((profile.height || 175)/100)**2) < 20 ? '→ Estás en buen punto para un LEAN BULK de 16-20 semanas. Come +300kcal y entrena duro.' :
'→ Puedes hacer RECOMPOSICIÓN comiendo en mantenimiento con alta proteína y entrenando con intensidad.'}`;
        }

        // Respuesta genérica de comparación
        return `🤔 **Buena pregunta.**

Cuéntame más específicamente qué estás comparando y te doy una respuesta detallada:
• "¿Es mejor barra o mancuernas para pecho?"
• "¿Hago volumen o definición?"
• "¿Máquinas o peso libre?"
• "¿3 o 4 días de entrenamiento?"
• "¿Full body o PPL?"
• "¿Cardio antes o después de pesas?"
• "¿Creatina o pre-entreno?"

¿Qué comparación necesitas?`;
    },

    generateAestheticAdvice(lowerPrompt, profile) {
        const weight = profile.weight || 70;
        let target = '';

        if (lowerPrompt.includes('abdomen') || lowerPrompt.includes('six pack') || lowerPrompt.includes('marcar')) target = 'abs';
        else if (lowerPrompt.includes('brazo') || lowerPrompt.includes('biceps')) target = 'brazos';
        else if (lowerPrompt.includes('espalda') || lowerPrompt.includes('anch')) target = 'espalda';
        else if (lowerPrompt.includes('hombro')) target = 'hombros';
        else if (lowerPrompt.includes('pecho')) target = 'pecho';
        else if (lowerPrompt.includes('pierna')) target = 'piernas';
        else if (lowerPrompt.includes('gluteo')) target = 'gluteos';

        const guides = {
            abs: `🎯 **Cómo Marcar Abdominales / Six Pack**

**La verdad incómoda:** Los abs se REVELAN con la dieta, se CONSTRUYEN con el entreno.
• Para ver abs necesitas ~12-15% grasa (hombres) o 18-22% (mujeres)
• Tu peso actual: ${weight}kg → necesitas estar a ~${Math.round(weight * 0.87)}kg aprox para ver abs

**📊 PLAN:**
1. **Nutrición (80% del resultado):**
   • Déficit de 400-500 kcal: come ${Math.round(weight * 25)} kcal/día
   • Proteína alta: ${Math.round(weight * 2.2)}g para preservar músculo
   • Corta carbos procesados, mantén los complejos

2. **Entrenamiento de abs (20% del resultado):**
   • 2-3 sesiones/semana es suficiente
   • Ejercicios con CARGA PROGRESIVA (no 100 crunches):
     - Hanging leg raises: 3x10-15 (el MEJOR)
     - Cable crunches: 3x12-15 (resistencia progresiva)
     - Ab wheel rollouts: 3x8-12 (brutal para el recto abdominal)
     - Pallof press: 3x12 cada lado (oblicuos sin ensanchar cintura)
   • NO hagas oblicuos con peso lateral (ensanchan cintura)

3. **Cardio:** 10.000 pasos/día + 2-3 sesiones LISS

**⏰ Timeline realista:**
${weight > 80 ? '• Desde tu peso actual: 12-16 semanas para abs visibles' : weight > 70 ? '• Desde tu peso: 8-12 semanas para abs visibles' : '• Estás cerca: 4-8 semanas con disciplina'}`,
            brazos: `🎯 **Cómo Tener Brazos Grandes (40cm+)**

**📐 Los números:**
• Brazo "grande": >38cm (flexionado, frío)
• Brazo "impresionante": >40cm
• El tríceps es 2/3 del brazo → no solo hagas bíceps

**📊 PLAN SEMANAL (10-14 series directas/semana por músculo):**

**Bíceps (cabeza larga + corta):**
1. Curl inclinado 45° — 3x10-12 (MEJOR para cabeza larga, máximo estiramiento)
2. Curl con barra EZ — 3x8-10 (más peso = más estímulo)
3. Curl martillo — 3x10-12 (braquial = grosor del brazo)
4. Curl concentrado/predicador — 2x12-15 (peak de bíceps)

**Tríceps (cabeza larga + lateral + medial):**
1. Extensión overhead (cable/mancuerna) — 3x10-12 (cabeza larga = la más grande)
2. Press cerrado — 3x8-10 (compound, más peso)
3. Pushdown con cuerda — 3x12-15 (lateral head = definición)
4. Kickbacks — 2x15-20 (contracción máxima)

**💡 Claves científicas:**
• El bíceps crece mejor con ejercicios en ESTIRAMIENTO (curl inclinado)
• El tríceps crece mejor con overhead (estira la cabeza larga)
• Entrena brazos 2-3x/semana para máximo crecimiento
• Progresa en PESO. Si siempre usas 10kg, tus brazos no cambian.`,
            espalda: `🎯 **Cómo Tener Espalda Ancha (V-Taper)**

El V-taper viene de: dorsales anchos + hombros anchos + cintura pequeña.

**📊 PLAN PARA ESPALDA ANCHA:**

**Ancho (dorsales):** — Tracción vertical
1. Dominadas pronadas anchas — 4x6-10 (EL MEJOR ejercicio para ancho)
2. Jalón al pecho agarre ancho — 3x10-12
3. Pullover con cable — 3x12-15 (aislamiento de dorsal)

**Grosor (trapecios, romboides):** — Tracción horizontal
4. Remo con barra — 4x8-10 (espalda GRUESA)
5. Remo sentado agarre neutro — 3x10-12
6. Face pulls — 3x15-20 (postura + deltoides post)

**Clave:** La conexión mente-músculo es CRÍTICA en espalda. "Tira con los codos, no con las manos." Imagina que tus manos son ganchos.

**Volumen semanal:** 16-22 series directas (la espalda aguanta mucho volumen)
**Frecuencia:** 2x/semana mínimo`,
            hombros: `🎯 **Cómo Tener Hombros 3D (Boulder Shoulders)**

Los hombros tienen 3 cabezas. La mayoría solo entrena 1. Por eso se ven planos.

**📊 PLAN:**

**Deltoides lateral (EL MÁS IMPORTANTE para amplitud):**
1. Elevaciones laterales — 4x12-15 (3-4 veces por semana, sí, así de frecuente)
2. Elevaciones laterales en cable — 3x12-15 (tensión constante)
3. Machine lateral raise — 3x15-20 (si tienes acceso)
→ **Total lateral: 15-25 series/semana** (aguantan MUCHA frecuencia)

**Deltoides anterior:** YA trabaja con presses. Solo necesita:
4. Press militar/mancuernas — 4x8-10 (1-2x/semana es suficiente)

**Deltoides posterior (para hombros 3D desde atrás):**
5. Face pulls — 3x15-20 (CADA sesión, como calentamiento)
6. Pájaros / reverse fly — 3x15-20

**💡 Secretos:**
• Las laterales se hacen LIGERAS. Ego = 0. Siente el deltoides.
• Inclina ligeramente hacia adelante y levanta hasta 75-80° (no 90°)
• El deltoides lateral tiene muchas fibras lentas → reps altas (12-20)
• No subas el trapecio al hacer laterales (baja los hombros)`,
            pecho: `🎯 **Cómo Tener un Pecho Grande y Definido**

**📊 PLAN ÓPTIMO:**

**Pecho superior (el que más impacta visualmente):**
1. Press inclinado 30° con mancuernas — 4x8-12 (PRIORIDAD #1)
2. Press inclinado con barra — 3x8-10

**Pecho medio:**
3. Press banca plano — 4x6-10 (fuerza + masa)
4. Aperturas con mancuernas/cable — 3x12-15 (estiramiento)

**Pecho inferior:**
5. Dips (inclinado hacia adelante) — 3x8-12
6. Cable crossover (de arriba a abajo) — 3x12-15

**💡 Ciencia:**
• El pecho crece mejor con ESTIRAMIENTO bajo carga (aperturas en banco plano/inclinado)
• Inclinado 30° (no 45°, eso ya es hombro)
• 12-18 series/semana totales es el sweet spot
• La conexión mente-músculo importa MUCHO en pecho`,
            piernas: `🎯 **Cómo Tener Piernas Grandes y Definidas**

**📊 PLAN:**

**Cuádriceps (frente del muslo):**
1. Sentadilla profunda (bajo paralelo) — 4x6-10 (rey de piernas)
2. Sentadilla búlgara — 3x10-12 (unilateral, glúteo + quad)
3. Leg extension — 3x12-15 (aislamiento, pump brutal)
4. Hack squat / leg press — 3x10-12 (más volumen sin fatiga espinal)

**Isquiotibiales (parte posterior):**
5. Peso muerto rumano — 4x8-12 (estiramiento máximo)
6. Leg curl acostado — 3x10-12 (aislamiento)
7. Nordic hamstring curl — 3x5-8 (avanzado, previene lesiones)

**Gemelos:**
8. Elevaciones de gemelos sentado — 4x12-15
9. Elevaciones de pie — 4x8-12

**💡 Secreto:** Profundidad > peso. Una sentadilla profunda con 80kg construye más que una a medias con 120kg.`,
            gluteos: `🎯 **Cómo Desarrollar Glúteos**

**Los 3 mejores ejercicios según EMG:**
1. **Hip Thrust** — 4x8-12 (mayor activación de glúteo máximo, LEJOS)
2. **Sentadilla Búlgara profunda** — 3x10-12 (estiramiento + activación)
3. **RDL (Peso Muerto Rumano)** — 3x8-12 (glúteo en estiramiento)

**Complementarios:**
4. Cable kickback — 3x12-15 (aislamiento)
5. Abducción sentado — 3x15-20 (glúteo medio)
6. Step-ups altos — 3x10 cada pierna

**Frecuencia:** 2-3x/semana | **Volumen:** 12-18 series/semana directas
**Clave:** El glúteo responde a PESO PESADO en hip thrust y rango completo en sentadillas.`
        };

        return guides[target] || `🎯 **Mejora Estética Integral**

Para verte lo MEJOR posible, estos son los músculos que más impacto visual tienen:
1. **Hombros anchos** → Te ves más grande vestido y da forma de V
2. **Espalda ancha** → V-taper, presencia física
3. **Pecho desarrollado** → Se nota con camiseta
4. **Brazos** → Lo que la gente mira primero
5. **Core definido** → La cherry on top

Dime qué parte específica quieres mejorar y te doy el plan detallado.`;
    },

    generateTrainingScience(lowerPrompt, profile, periodWeek) {
        const level = profile.level || 'intermedio';

        if (lowerPrompt.includes('cuantas series') || lowerPrompt.includes('volumen')) {
            return `📊 **Guía de Volumen Óptimo por Grupo Muscular (series/semana)**

Basado en meta-análisis de Schoenfeld et al. y recomendaciones de Mike Israetel:

| Músculo | Mínimo (mantener) | Óptimo (crecer) | Máximo (avanzado) |
|---------|-------------------|-----------------|-------------------|
| Pecho | 6 | 12-18 | 22 |
| Espalda | 8 | 14-22 | 25 |
| Hombros (lateral) | 6 | 15-22 | 30 |
| Cuádriceps | 6 | 12-18 | 22 |
| Isquiotibiales | 4 | 10-14 | 18 |
| Bíceps | 4 | 10-14 | 20 |
| Tríceps | 4 | 8-14 | 18 |
| Glúteos | 4 | 10-16 | 20 |

**Para tu nivel (${level}):** Empieza por el rango bajo-medio y sube 1-2 series cada semana hasta que notes que no te recuperas. Ahí tienes tu volumen máximo individual.

**📏 Regla:** Si un músculo está DÉBIL → dale más volumen (near máximo). Si está FUERTE → mantenerlo con el mínimo y redistribuye volumen.`;
        }

        if (lowerPrompt.includes('rpe') || lowerPrompt.includes('rir') || lowerPrompt.includes('fallo') || lowerPrompt.includes('intensidad')) {
            return `📊 **RPE / RIR y Proximidad al Fallo**

**¿Qué es RPE?** Rating of Perceived Exertion (escala de esfuerzo)
**¿Qué es RIR?** Reps In Reserve (repeticiones que te quedan)

| RPE | RIR | Descripción |
|-----|-----|-------------|
| 10 | 0 | FALLO MUSCULAR. No puedes hacer ni 1 rep más |
| 9.5 | 0-1 | Quizás podrías hacer 1 más con ayuda |
| 9 | 1 | Te queda 1 rep segura |
| 8 | 2 | Te quedan 2 reps seguras |
| 7 | 3 | Te quedan 3 reps. Moderadamente difícil |
| 6 | 4+ | Relativamente fácil |

**📊 Tu fase actual: RPE ${periodWeek.rpe}**

**¿Debo ir al fallo?**
${level === 'principiante' ? 
'• Como principiante: NUNCA al fallo. Entrena a RPE 7-8 (2-3 RIR). Tu técnica se rompe antes del fallo muscular real.' :
level === 'intermedio' ?
'• Como intermedio: Última serie de cada ejercicio a RPE 9 (1 RIR). El resto a RPE 7-8.' :
'• Como avanzado: Puedes ir al fallo en la última serie de aislamientos. Nunca al fallo en compuestos pesados (squat, deadlift).'}

**💡 La ciencia dice:**
• Entrenar a 1-3 RIR produce ~90% del estímulo que ir al fallo
• Ir al fallo = MUCHA más fatiga por poco estímulo extra
• El fallo repetido = sobreentrenamiento
• Reserva el fallo para últimas series de aislamientos`;
        }

        return `📊 **Principios de Entrenamiento Basados en Ciencia**

**Los 4 pilares de la hipertrofia:**
1. **Tensión mecánica** → Usar peso suficiente (60-85% 1RM)
2. **Volumen** → Suficientes series por músculo/semana
3. **Progresión** → Hacer MÁS que la sesión anterior
4. **Recovery** → Descanso y nutrición para crecer

**📏 Para tu nivel (${level}):**
• Series por ejercicio: ${level === 'principiante' ? '3' : level === 'intermedio' ? '3-4' : '3-5'}
• Reps para hipertrofia: 6-12 (compound), 10-20 (isolation)
• RPE: ${periodWeek.rpe}
• Frecuencia por músculo: ${level === 'principiante' ? '3x/semana (full body)' : '2x/semana (upper/lower o PPL)'}
• Descanso: 2-3min compound, 60-90s isolation
• Progresión: +2.5kg o +1 rep cada semana

¿Quieres que profundice en algún aspecto?`;
    },


    generatePlateauAdvice(profile, periodWeek) {
        const week = Storage.getCurrentWeek();
        const workouts = Storage.getWorkoutHistory();

        return `🚧 **Cómo Romper un Estancamiento**

Es NORMAL estancarse. Le pasa a todos. No significa que algo está mal, significa que necesitas un ajuste.

---

**🔍 DIAGNÓSTICO - ¿Por qué no progresas?**

Revisa estos puntos en orden (el 90% de los estancamientos se resuelve con los 3 primeros):

1. **¿Duermes 7-9 horas?** → Sin sueño NO creces. Punto.
2. **¿Comes suficiente?** → Mínimo ${Math.round((profile.weight || 70) * 2)}g proteína + ${profile.goal && profile.goal.includes('ganar') ? 'superávit calórico' : 'calorías suficientes'}
3. **¿Has descansado últimamente?** → Si llevas +6 semanas sin deload, TÓMATE UNA.
4. **¿Llevas tracking de pesos?** → Si no anotas, no progresas. No sabes si subiste o no.
5. **¿Tu técnica es buena?** → A veces basta con mejorar la ejecución para sentir más el músculo.

---

**💊 SOLUCIONES (pruébalas en este orden):**

**Opción 1: Deload (1 semana)**
→ Entrena al 50-60% de tu peso normal. La fatiga acumulada puede estar frenándote.

**Opción 2: Cambio de estímulo**
→ Cambia ejercicios que llevas +6 semanas haciendo igual
→ Ej: Bench con barra → Press con mancuernas
→ Ej: Sentadilla → Búlgara o Hack Squat

**Opción 3: Manipula variables**
→ Si siempre haces 3x10, prueba 5x5 (más peso, menos reps)
→ O prueba 3x15-20 (menos peso, más reps, diferente estímulo)
→ Cambia el tempo: 3-1-1-0 (excéntrica más lenta)

**Opción 4: Sube el volumen**
→ Añade 1-2 series más por ejercicio estancado
→ Añade 1 ejercicio extra para ese músculo

**Opción 5: Técnicas de intensidad**
→ Drop sets en la última serie
→ Rest-pause (fallo → 15s → fallo → 15s → fallo)
→ Myo-reps (fallo → 5s → 3 reps × 3-5 mini-sets)

---

**🎯 MI RECOMENDACIÓN PARA TI (Semana ${week}):**
${week >= 5 && !periodWeek.deload ? 
'Llevas ' + week + ' semanas. Tómate una semana de deload AHORA y volverás más fuerte.' :
'Cambia los ejercicios de los músculos estancados y sube 2 series. Dale 3 semanas y evalúa.'}

**💡 Recuerda:** El estancamiento es temporal. SIEMPRE se rompe con paciencia y ajustes inteligentes. La gente que se rinde aquí nunca sabe que estaba a 2 semanas de su próximo PR.`;
    },

    generateGreeting(profile, periodWeek) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
        const week = Storage.getCurrentWeek();
        const workouts = Storage.getWorkoutHistory();
        const todayWorkout = workouts.find(w => new Date(w.date).toDateString() === new Date().toDateString());

        return `${greeting}, ${profile.name || 'crack'}! 👋

📅 **Estás en la semana ${week}/12 — Fase: ${periodWeek.phase}**
⚡ Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}
${periodWeek.deload ? '🟢 Es semana de DELOAD. Tómalo con calma.' : ''}
${todayWorkout ? '✅ Ya entrenaste hoy. ¡Bien hecho!' : '💪 Aún no entrenas hoy. ¿Vamos al gym?'}

**¿En qué te ayudo?** Puedo:
• 💪 Darte el entrenamiento de hoy listo para ejecutar
• 🥗 Decirte qué comer ahora mismo
• 📊 Analizar tu progreso y ajustar el plan
• 🎯 Resolver cualquier duda de entreno o nutrición
• 📸 Valorar una foto de tu físico
• ⏰ Planificar según tu deadline/fecha objetivo

Solo dime qué necesitas. Estoy para que logres tu mejor versión. 🔥`;
    },

    generateThankYouResponse(profile) {
        const responses = [
            `¡Para eso estoy, ${profile.name || 'crack'}! 💪 Si te surge cualquier duda, aquí me tienes. Ahora a darle con todo. 🔥`,
            `¡De nada! 🙌 Recuerda: consistencia > perfección. Cada día que te presentas estás ganando. ¿Algo más que pueda hacer por ti?`,
            `¡Me alegra ayudar! 💪 Tú pon el esfuerzo y yo la guía. Juntos vamos a lograr esa transformación. ¿Necesitas algo más?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    generateContextualResponse(prompt, lowerPrompt, profile, periodWeek) {
        // ===== RESPUESTA INTELIGENTE A CUALQUIER PREGUNTA =====
        const week = Storage.getCurrentWeek();
        const weight = profile.weight || 70;
        const name = profile.name || 'crack';

        // Preguntas sobre tiempo/frecuencia
        if (lowerPrompt.includes('cuanto tiempo') || lowerPrompt.includes('cuantas veces') || lowerPrompt.includes('cuantos dias')) {
            return `⏱️ **Sobre tiempo y frecuencia, ${name}:**\n\n• **Entreno:** ${profile.daysPerWeek || 4} días/semana es lo ideal para ti\n• **Duración por sesión:** 45-75 minutos (más no es mejor)\n• **Descanso entre sesiones:** Mínimo 48h para el mismo músculo\n• **Para ver resultados:** 4-6 semanas de consistencia mínimo\n• **Para transformación real:** 12-16 semanas (tu programa es de 12)\n\n¿Quieres más detalles sobre algo específico?`;
        }

        // Preguntas tipo "es verdad que" o mitos
        if (lowerPrompt.includes('es verdad') || lowerPrompt.includes('es cierto') || lowerPrompt.includes('mito') || lowerPrompt.includes('sirve')) {
            return `🔬 **Sobre tu pregunta, ${name}:**\n\nDéjame darte la respuesta basada en ciencia:\n\n**Mitos comunes del fitness (la verdad):**\n• "Sudar = quemar grasa" → FALSO. El sudor es termorregulación, no quema de grasa.\n• "Las mujeres se ponen enormes con pesas" → FALSO. No tienen testosterona suficiente.\n• "Hay que comer cada 3 horas" → FALSO. Lo que importa es el total diario.\n• "El cardio quema músculo" → PARCIAL. Solo si es excesivo sin proteína.\n• "No comer de noche engorda" → FALSO. Importa el total calórico del día.\n• "Los abdominales se hacen en la cocina" → VERDAD. Necesitas bajo % grasa para verlos.\n• "La creatina es mala/peligrosa" → FALSO. Es el suplemento más seguro y estudiado.\n\n¿Tu pregunta específica es sobre alguno de estos o algo diferente?`;
        }

        // Preguntas sobre agua/hidratación
        if (lowerPrompt.includes('agua') || lowerPrompt.includes('hidrat') || lowerPrompt.includes('beber') || lowerPrompt.includes('liquido')) {
            return `💧 **Hidratación para ${name} (${weight}kg):**\n\n• **Mínimo diario:** ${Math.round(weight * 0.035)}L (${Math.round(weight * 35)}ml)\n• **Días de entreno:** +500ml-1L extra\n• **Si sudas mucho:** +1L adicional\n\n**Señales de deshidratación:**\n• Orina amarilla oscura\n• Fatiga durante entreno\n• Dolor de cabeza\n• Calambres\n\n**Tips:**\n• Bebe antes de sentir sed\n• Lleva botella al gym siempre\n• Bebe 500ml al despertar\n• Electrolitos si entrenas >90min\n\n💡 La hidratación afecta DIRECTAMENTE tu rendimiento. Un 2% de deshidratación = -10% de fuerza.`;
        }

        // Preguntas sobre peso/báscula
        if (lowerPrompt.includes('peso') || lowerPrompt.includes('bascula') || lowerPrompt.includes('balanza') || lowerPrompt.includes('pesarme') || lowerPrompt.includes('subi') || lowerPrompt.includes('baje')) {
            return `⚖️ **Sobre el peso, ${name}:**\n\n**Tu peso actual:** ${weight}kg\n\n**Importante entender:**\n• El peso fluctúa 1-3kg/día (agua, comida, sodio, estrés)\n• NO te peses todos los días y saques conclusiones\n• Pésate 3x/semana EN AYUNAS y saca el PROMEDIO semanal\n• Solo el promedio semanal importa, no el día a día\n\n**¿Subiste de peso?**\n• Si comes en superávit: es normal (+0.25-0.5kg/semana MAX es muscle)\n• Si subiste 1-2kg de un día a otro: es AGUA, no grasa\n• Después de día libre/cheat: sube 1-3kg de agua (se va en 2-3 días)\n\n**¿Bajaste de peso?**\n• -0.5 a 1kg/semana en déficit = perfecto\n• Si bajas más rápido: puedes perder músculo\n• Si no bajas: reduce 200kcal más o añade cardio\n\n**Tu objetivo semanal:**\n${profile.goal && profile.goal.includes('perder') ? '• Perder 0.5-1kg/semana (no más para preservar músculo)' : '• Ganar 0.25-0.5kg/semana (más = mucha grasa)'}\n\n¿Algo más específico sobre tu peso?`;
        }

        // Preguntas sobre ropa/verse bien
        if (lowerPrompt.includes('ropa') || lowerPrompt.includes('verse bien') || lowerPrompt.includes('verme bien') || lowerPrompt.includes('estetica') || lowerPrompt.includes('fisico') || lowerPrompt.includes('bonito') || lowerPrompt.includes('atractivo')) {
            return `👔 **Cómo verte mejor físicamente, ${name}:**\n\n**Los músculos que más impacto visual tienen (orden):**\n1. 🟠 **Hombros anchos** → Lo #1 que te hace ver grande vestido\n2. 🔵 **Espalda ancha** → V-taper, presencia física\n3. 🔴 **Pecho desarrollado** → Se nota con camiseta\n4. 💗 **Brazos** → Lo que la gente mira primero\n5. 🟡 **Cintura estrecha** → Contraste con hombros = wow\n\n**El "secreto" para verse bien:**\n• Hombros anchos + cintura estrecha = el mejor físico posible\n• Prioriza: Laterales (hombros), Pull-ups (espalda), Press (pecho)\n• La grasa abdominal es el ENEMIGO #1 de la estética\n\n**Timeline:**\n• 4 semanas: ropa queda diferente\n• 8 semanas: TÚ notas el cambio\n• 12 semanas: los demás preguntan "¿qué hiciste?"\n\n¿Quieres un plan enfocado en estética?`;
        }

        // Preguntas sobre ansiedad/estrés/bienestar mental
        if (lowerPrompt.includes('ansiedad') || lowerPrompt.includes('estres') || lowerPrompt.includes('depres') || lowerPrompt.includes('triste') || lowerPrompt.includes('mental') || lowerPrompt.includes('animo')) {
            return `🧠 **Fitness y Salud Mental, ${name}:**\n\nEl ejercicio es uno de los MEJORES antidepresivos naturales. La ciencia es clara:\n\n**Beneficios comprobados del ejercicio en salud mental:**\n• Libera endorfinas (la "droga de la felicidad")\n• Reduce cortisol (hormona del estrés) un 30-40%\n• Mejora calidad de sueño (fundamental para el ánimo)\n• Aumenta autoestima y confianza\n• Da estructura y propósito al día\n\n**Mi recomendación:**\n1. Entrena aunque no tengas ganas (5 min → el resto fluye)\n2. Prioriza pesas sobre cardio (más impacto en autoestima)\n3. Duerme 7-9h (sin sueño todo empeora)\n4. Camina 20-30min al aire libre (luz solar = serotonina)\n5. Come bien (la nutrición afecta MUCHO el estado mental)\n\n💡 El gym no solo transforma tu cuerpo, transforma tu MENTE.\n\n⚠️ Si sientes que necesitas ayuda profesional, no dudes en buscar un psicólogo. El gym complementa, pero no reemplaza la terapia profesional.\n\n¿Quieres que te arme un plan de entreno enfocado en bienestar?`;
        }

        // Preguntas sobre principiantes
        if (lowerPrompt.includes('empezar') || lowerPrompt.includes('comenzar') || lowerPrompt.includes('principiante') || lowerPrompt.includes('nuevo') || lowerPrompt.includes('primera vez') || lowerPrompt.includes('no se nada')) {
            return `🌱 **Guía para Empezar, ${name}:**\n\n¡Bienvenido! Los principiantes tienen la MEJOR ventaja: los "noob gains". Tu cuerpo va a cambiar más rápido que nunca en los primeros meses.\n\n**Plan de las primeras 4 semanas:**\n\n1. **Frecuencia:** 3 días/semana (Lunes, Miércoles, Viernes)\n2. **Rutina:** Full Body (trabaja todo cada sesión)\n3. **Ejercicios básicos que aprender:**\n   • Sentadilla (piernas)\n   • Press de banca (pecho)\n   • Remo con barra (espalda)\n   • Press militar (hombros)\n   • Curl de bíceps\n   • Pushdown de tríceps\n\n4. **Nutrición simple:**\n   • Come ${Math.round(weight * 30)}kcal/día\n   • ${Math.round(weight * 1.8)}g de proteína/día\n   • Come verduras en cada comida\n\n5. **Reglas de oro:**\n   • NUNCA faltes 2 días seguidos\n   • Técnica > Peso (siempre)\n   • Progresa +2.5kg/semana en los básicos\n   • Duerme 7-9 horas\n\n💪 Dime "créame una rutina" y te genero una perfecta para principiantes.`;
        }

        // Preguntas sobre horarios/cuándo entrenar
        if (lowerPrompt.includes('hora') || lowerPrompt.includes('manana') || lowerPrompt.includes('noche') || lowerPrompt.includes('cuando entrenar') || lowerPrompt.includes('mejor momento')) {
            return `⏰ **¿Cuándo es mejor entrenar, ${name}?**\n\n**La verdad:** La MEJOR hora es la que puedas ser CONSISTENTE.\n\n**Pero si puedes elegir:**\n• **Mañana (6-10am):** Testosterona más alta, menos gente en gym\n• **Mediodía (11-14):** Cuerpo ya caliente, buenos niveles de energía\n• **Tarde (15-19):** Fuerza máxima (pico de rendimiento), reflejos mejores\n• **Noche (20-22):** Puede afectar sueño si es muy intenso\n\n**Mi recomendación para ti:**\n• Si tu objetivo es fuerza → tarde (4-7pm)\n• Si tu objetivo es perder grasa → mañana en ayunas (más quema)\n• Si solo puedes de noche → entrena de noche (es mejor que no entrenar)\n\n💡 **Lo que SÍ importa:**\n• Entrenar siempre a la misma hora (el cuerpo se adapta)\n• Comer 1-2h antes del entreno\n• No entrenar justo después de una comida pesada\n\n¿Necesitas que ajuste tu rutina a tu horario?`;
        }

        // Preguntas sobre alcohol
        if (lowerPrompt.includes('alcohol') || lowerPrompt.includes('cerveza') || lowerPrompt.includes('trago') || lowerPrompt.includes('fiesta') || lowerPrompt.includes('beber')) {
            return `🍺 **Alcohol y Fitness, ${name}:**\n\n**La realidad cruda:**\n• El alcohol REDUCE la síntesis proteica un 20-30%\n• Baja testosterona por 24-72h\n• Deshidrata (peor rendimiento)\n• Son calorías VACÍAS (7kcal/gramo)\n• Empeora calidad de sueño\n\n**¿Puedo tomar y aún tener resultados?**\nSí, pero con reglas:\n\n1. Máximo 1-2 tragos, 1-2 veces por semana\n2. NUNCA el día de entreno ni el día anterior a piernas/espalda\n3. Come proteína antes y después de beber\n4. Hidrátate mucho (1 vaso de agua por cada trago)\n5. Si te excedes: el día siguiente come normal (no ayunes)\n\n**Las "menos malas" opciones:**\n• Vodka + soda (bajo en calorías)\n• Vino tinto (antioxidantes)\n• Cerveza light\n\n**Las peores:**\n• Cócteles dulces (300-500kcal cada uno)\n• Cerveza regular (150-200kcal)\n\n💡 Si estás en un cut serio: 0 alcohol por 8-12 semanas acelera MUCHO los resultados.`;
        }

        // Si llegamos aquí, intentar dar una respuesta útil basada en el prompt
        return `💬 **${name}, sobre tu pregunta:**\n\n"${prompt}"\n\nAunque no tengo una respuesta específica preprogramada para esto, te puedo ayudar con todo lo relacionado a:\n\n💪 **Entrenamiento** - Rutinas, ejercicios, técnica, progresión\n🥗 **Nutrición** - Macros, comidas, dietas, suplementos\n📊 **Progreso** - Valoración, análisis, comparación\n🎯 **Objetivos** - Planes con timeline, metas realistas\n😴 **Recuperación** - Sueño, descanso, manejo de lesiones\n🔬 **Ciencia** - Mitos vs realidad, estudios\n🧠 **Motivación** - Mentalidad, disciplina, hábitos\n\n**Prueba preguntarme cosas como:**\n• "¿Qué hago si no veo resultados?"\n• "¿Cuánta proteína necesito exactamente?"\n• "¿Cómo elimino la grasa del abdomen?"\n• "¿Es mejor cardio o pesas para bajar de peso?"\n• "Dame mi rutina de hoy"\n• "Créame una rutina nueva"\n\n¿En qué te puedo ayudar? 🔥`;
    },

    // ===== API DE IMAGEN =====
    localImageAnalysis(question) {
        const profile = Storage.getProfile();
        const measurements = Storage.getMeasurements();
        const week = Storage.getCurrentWeek();
        const weight = profile.weight || 70;
        const height = profile.height || 175;
        const bmi = (weight / ((height/100)**2)).toFixed(1);
        
        return `📸 **Foto Recibida - Valoración Basada en tu Perfil**

📊 **Datos actuales:**
• Peso: ${weight}kg | Altura: ${height}cm | IMC: ${bmi}
• Nivel: ${profile.level} | Semana: ${week}/12
• Objetivo: ${profile.goal}

🔍 **Mi Análisis (basado en tus datos y progreso):**

${bmi < 20 ? '• Estás en un peso bajo. Prioriza ganancia de masa muscular con superávit calórico.' : 
bmi < 25 ? '• Tu IMC está en rango normal. Excelente base para recomposición o lean bulk.' :
bmi < 30 ? '• Tienes algo de sobrepeso. Un déficit moderado de 400kcal + entrenamiento te transformará.' :
'• Necesitas enfocarte en pérdida de grasa con déficit calórico constante.'}

💪 **Recomendaciones según tu foto:**
1. ${profile.goal && profile.goal.includes('perder') ? 'Mantén el déficit calórico y entrena con intensidad para preservar músculo' : 'Come en superávit controlado (+300kcal) y progresa en los compuestos'}
2. Enfócate en ${profile.level === 'principiante' ? 'aprender la técnica de los básicos y crear el hábito' : 'progresión de cargas y volumen adecuado por músculo'}
3. Toma fotos cada 2 semanas en las mismas condiciones para comparar
4. El cambio visual real empieza a notarse a partir de la semana 4-6

📈 **Para la próxima foto:**
• Misma iluminación, misma hora (mañana en ayunas)
• Poses: frontal relajado, frontal flex, lateral, espalda
• Así podrás comparar progreso real

${measurements.length > 0 ? `\n📏 Tu último registro de peso: ${measurements[measurements.length-1].weight || weight}kg` : ''}

💡 **Tip:** Registra tus medidas en la sección Progreso para trackear cambios que la balanza no muestra (cintura, brazos, pecho).

¿Quieres que te dé un plan específico basado en tu objetivo?`;
    },

    // ===== GENERAR RUTINA PERSONALIZADA =====
    generateCustomRoutine(profile) {
        const days = profile.daysPerWeek || 4;
        let templateKey;

        if (days <= 3) templateKey = 'fullBody';
        else if (days === 4) templateKey = 'upperLower';
        else if (days === 5) templateKey = 'bro';
        else templateKey = 'ppl';

        const template = ROUTINE_TEMPLATES[templateKey];
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        return {
            id: 'ai-generated-' + Date.now(),
            name: template.name + ' (IA)',
            description: `Generada por IA - Semana ${week} - ${periodWeek.phase}. Programa de 12 semanas con periodización ondulante.`,
            template: templateKey,
            days: template.days.map(day => ({
                name: day.name,
                exercises: day.exercises.map(exId => {
                    const exercise = EXERCISES_DB.find(e => e.id === exId);
                    if (!exercise) return exId;
                    return {
                        ...exercise,
                        targetSets: exercise.sets,
                        targetReps: exercise.reps,
                        intensity: periodWeek.intensity,
                        rpe: periodWeek.rpe
                    };
                })
            })),
            weekCreated: week,
            phase: periodWeek.phase,
            createdAt: new Date().toISOString()
        };
    }
};
