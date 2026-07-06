// ===== AI ENGINE v3.0 - Intelligent Fitness AI =====
const AIEngine = {
    getApiKey() {
        return Storage.getSettings().apiKey || '';
    },

    async generateResponse(prompt, context = {}) {
        const apiKey = this.getApiKey();
        if (apiKey) {
            return await this.callOpenAI(prompt, context);
        }
        return this.intelligentLocalAI(prompt, context);
    },

    async callOpenAI(prompt, context) {
        const apiKey = this.getApiKey();
        const profile = Storage.getProfile();
        const systemPrompt = this.buildSystemPrompt(profile, context);
        const chatHistory = Storage.getChatHistory().slice(-10);

        const messages = [{ role: 'system', content: systemPrompt }];
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
            return this.intelligentLocalAI(prompt, context);
        } catch (error) {
            return this.intelligentLocalAI(prompt, context);
        }
    },

    async analyzeImage(base64Image, question = '') {
        const apiKey = this.getApiKey();
        if (apiKey) {
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
                            { role: 'system', content: `Eres un entrenador personal experto. El usuario: ${profile.name || 'Usuario'}, ${profile.weight || '?'}kg, ${profile.height || '?'}cm, ${profile.age || '?'} anos, nivel ${profile.level || 'intermedio'}, objetivo: ${profile.goal || 'mejorar fisico'}. Analiza la imagen de forma directa y constructiva. Responde en espanol.` },
                            { role: 'user', content: [
                                { type: 'text', text: question || 'Analiza esta foto de mi fisico. Dame valoracion completa: estimacion de % grasa, puntos fuertes, areas a mejorar, y plan de accion.' },
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
            } catch(e) { /* fallback below */ }
        }
        return this.localImageAnalysis();
    },

    buildSystemPrompt(profile, context) {
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();

        return `Eres un entrenador personal de elite, nutricionista deportivo y coach de rendimiento. Responde SIEMPRE en espanol.

DATOS DEL USUARIO:
- Nombre: ${profile.name || 'Usuario'} | Edad: ${profile.age || '?'} | Genero: ${profile.gender || '?'}
- Peso: ${profile.weight || '?'}kg | Altura: ${profile.height || '?'}cm
- Objetivo: ${profile.goal || 'mejorar fisico'} | Nivel: ${profile.level || 'intermedio'}
- Dias disponibles: ${profile.daysPerWeek || 4}/semana
- Semana actual: ${week}/12 | Fase: ${periodWeek.phase} | RPE: ${periodWeek.rpe}
- Entrenamientos completados: ${workouts.length} | PRs: ${Object.keys(prs).length}

REGLAS:
1. Se directo, practico y basado en evidencia cientifica
2. Da numeros concretos siempre: peso, series, reps, kcal, gramos
3. Personaliza TODO al perfil del usuario
4. No uses emojis excesivos - maximo 1-2 por respuesta para separar secciones
5. Formato limpio y legible con negritas para datos importantes
6. Si preguntan algo fuera de fitness/nutricion/salud, responde brevemente y redirige
7. NUNCA respondas sobre contenido sexual, ilegal, violento o de sustancias prohibidas`;
    },


    // ===== INTELLIGENT LOCAL AI v3.0 =====
    intelligentLocalAI(prompt, context) {
        const input = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        // Content filter
        if (this.isBlockedContent(input)) {
            return 'No puedo ayudarte con eso. Solo respondo sobre fitness, nutricion, entrenamiento y salud fisica. Preguntame algo dentro de esos temas.';
        }

        // Extract preferences
        this.extractPreferences(prompt, input);

        // Intelligent intent detection with scoring
        const intent = this.detectIntent(input);
        
        switch(intent) {
            case 'today_workout': return this.genTodayWorkout(profile, periodWeek);
            case 'muscle_workout': return this.genMuscleWorkout(input, profile, periodWeek);
            case 'exercise_info': return this.genExerciseInfo(input, profile);
            case 'full_program': return this.genFullProgram(profile, periodWeek, input);
            case 'nutrition': return this.genNutrition(input, profile);
            case 'meal_specific': return this.genMealIdeas(input, profile);
            case 'supplements': return this.genSupplements(input, profile);
            case 'injury': return this.genInjuryAdvice(input, profile);
            case 'recovery': return this.genRecovery(profile, periodWeek);
            case 'cardio': return this.genCardio(profile, input);
            case 'progress': return this.genProgress(profile);
            case 'assessment': return this.genAssessment(profile, periodWeek);
            case 'plateau': return this.genPlateau(profile, periodWeek);
            case 'timeline': return this.genTimeline(input, profile);
            case 'comparison': return this.genComparison(input, profile);
            case 'aesthetic': return this.genAesthetic(input, profile);
            case 'training_science': return this.genTrainingScience(input, profile, periodWeek);
            case 'motivation': return this.genMotivation(profile);
            case 'somatotype': return this.genSomatotype(profile);
            case 'one_rm': return this.genOneRM(input, profile);
            case 'create_routine': return this.genCreateRoutine(profile, periodWeek);
            case 'greeting': return this.genGreeting(profile, periodWeek);
            case 'thanks': return this.genThanks(profile);
            case 'weight_management': return this.genWeightManagement(input, profile);
            case 'flexibility': return this.genFlexibility(input, profile);
            case 'beginner': return this.genBeginnerGuide(profile);
            case 'alcohol': return this.genAlcohol(profile);
            case 'sleep': return this.genSleep(profile);
            case 'stress': return this.genStress(profile);
            case 'hydration': return this.genHydration(profile);
            case 'myths': return this.genMyths(input);
            case 'hormones': return this.genHormones(input, profile);
            case 'aging': return this.genAging(input, profile);
            case 'womens_fitness': return this.genWomensFitness(input, profile);
            case 'home_workout': return this.genHomeWorkout(input, profile);
            case 'frequency': return this.genFrequency(input, profile);
            default: return this.genSmartDefault(prompt, input, profile, periodWeek);
        }
    },

    // ===== CONTENT FILTER =====
    isBlockedContent(text) {
        const blocked = ['sexo','sexual','porno','desnud','drogas ilegal','esteroides ilegal',
            'matar','suicid','arma','bomba','hackear','robar','xxx','onlyfans',
            'violencia','violar','terroris','pedofil','trafico'];
        return blocked.some(w => text.includes(w));
    },


    // ===== INTELLIGENT INTENT DETECTION =====
    detectIntent(text) {
        const intents = [
            { id: 'create_routine', keywords: ['creame una rutina','hazme una rutina','arma mi rutina','genera mi rutina','crea mi programa','quiero una rutina nueva','necesito una rutina','generame'], score: 0 },
            { id: 'today_workout', keywords: ['que hago hoy','que entreno hoy','entrenamiento de hoy','que toca hoy','dame el entreno','voy al gym','sesion de hoy','workout de hoy','entreno hoy','que puedo hacer hoy'], score: 0 },
            { id: 'muscle_workout', keywords: ['entrena','trabaja','hoy toca','dame','rutina de','ejercicios de','sesion de'], muscles: ['pecho','espalda','hombro','pierna','biceps','triceps','core','abdomen','gluteo','pantorrilla','trapecio'], score: 0 },
            { id: 'exercise_info', keywords: ['mejor ejercicio','mejores ejercicios','que ejercicio','ejercicios para','como hacer','tecnica de','alternativa a','sustituir','como se hace'], score: 0 },
            { id: 'full_program', keywords: ['rutina','programa','plan de entrenamiento','planificacion','mesociclo','diseña','ppl','push pull','upper lower','full body'], score: 0 },
            { id: 'nutrition', keywords: ['nutri','dieta','comer','comida','macro','caloria','proteina','carbohidrato','grasa','que como','cuanto debo comer','meal prep','deficit','superavit','bulk','cut'], score: 0 },
            { id: 'meal_specific', keywords: ['desayuno','almuerzo','cena','snack','receta','pre entreno','post entreno','antes de entrenar','despues de entrenar','merienda'], score: 0 },
            { id: 'supplements', keywords: ['suplement','creatina','whey','pre-entreno','bcaa','vitamina','omega','proteina en polvo','batido'], score: 0 },
            { id: 'injury', keywords: ['dolor','lesion','molestia','me duele','lastim','pinzamiento','tendinitis','hombro','rodilla','espalda baja','lumbar','codo','muneca'], score: 0 },
            { id: 'recovery', keywords: ['descanso','recuper','sobreentren','fatiga','deload','overtrain'], score: 0 },
            { id: 'sleep', keywords: ['dormir','sueno','insomnio','hora de dormir','calidad de sueno','melatonina'], score: 0 },
            { id: 'cardio', keywords: ['cardio','correr','hiit','liss','aerobico','bicicleta','nadar','quemar grasa','acondicionamiento','trotar','caminar'], score: 0 },
            { id: 'progress', keywords: ['progreso','avance','resultado','cuanto he mejorado','estadistica','resumen','como voy'], score: 0 },
            { id: 'assessment', keywords: ['valorar','valoraci','evalua','estado','como estoy','donde estoy','mi nivel','analisis'], score: 0 },
            { id: 'plateau', keywords: ['estancad','no progreso','no avanzo','plateau','no subo peso','no crezco','no cambio','no veo resultado','no funciona'], score: 0 },
            { id: 'timeline', keywords: ['para cuando','en cuanto tiempo','meses','semanas','antes de','para el verano','plazo','deadline','fecha','cuanto tardo'], score: 0 },
            { id: 'comparison', keywords: ['es mejor','que es mejor','diferencia entre','vs','conviene','deberia','que hago si','sirve','cual es mejor'], score: 0 },
            { id: 'aesthetic', keywords: ['como tener','como sacar','como marcar','six pack','brazos grandes','espalda ancha','hombros grandes','pecho grande','gluteos','piernas grandes','verse bien','estetica'], score: 0 },
            { id: 'training_science', keywords: ['cuantas series','cuantas reps','cuanto volumen','frecuencia','cuantos dias','cuanto peso','rpe','rir','al fallo','intensidad','volumen optimo'], score: 0 },
            { id: 'motivation', keywords: ['motiv','animo','no quiero','cansad','pereza','flojera','no puedo','abandonar','dificil','desganad'], score: 0 },
            { id: 'somatotype', keywords: ['somatotipo','tipo de cuerpo','ectomorfo','mesomorfo','endomorfo'], score: 0 },
            { id: 'one_rm', keywords: ['1rm','maximo','rm','repeticion maxima','calcula mi maximo','fuerza maxima'], score: 0 },
            { id: 'weight_management', keywords: ['peso','bascula','subir peso','bajar peso','engordar','adelgazar','recomposicion','perder grasa','ganar peso'], score: 0 },
            { id: 'flexibility', keywords: ['flexibilidad','estira','movilidad','yoga','elongacion','rango de movimiento'], score: 0 },
            { id: 'beginner', keywords: ['empezar','comenzar','principiante','nuevo en','primera vez','no se nada','por donde empiezo'], score: 0 },
            { id: 'alcohol', keywords: ['alcohol','cerveza','trago','fiesta','beber','vino','licor'], score: 0 },
            { id: 'stress', keywords: ['ansiedad','estres','depres','triste','mental','salud mental','nervio'], score: 0 },
            { id: 'hydration', keywords: ['agua','hidrat','liquido','cuanta agua','sed'], score: 0 },
            { id: 'myths', keywords: ['es verdad','es cierto','mito','verdad o mentira','realmente','funciona'], score: 0 },
            { id: 'hormones', keywords: ['testosterona','hormona','cortisol','insulina','hormonal','tiroides'], score: 0 },
            { id: 'aging', keywords: ['edad','viejo','anos','mayor','envejecer','despues de los 40','50 anos'], score: 0 },
            { id: 'womens_fitness', keywords: ['mujer','femenin','embarazo','menstruacion','ciclo menstrual','menopausia'], score: 0 },
            { id: 'home_workout', keywords: ['casa','en casa','sin equipo','sin gym','sin pesas','bodyweight','calistenia'], score: 0 },
            { id: 'frequency', keywords: ['cuanto tiempo','cuantas veces','cuantos dias','cada cuanto','con que frecuencia','hora','cuando entrenar'], score: 0 },
            { id: 'greeting', keywords: ['hola','hey','buenas','que tal','como estas','buenos dias','buenas tardes','buenas noches'], score: 0 },
            { id: 'thanks', keywords: ['gracias','genial','perfecto','excelente','crack','buenisimo','me encanta','eres el mejor','increible'], score: 0 },
        ];

        // Score each intent
        for (let intent of intents) {
            for (let kw of intent.keywords) {
                if (text.includes(kw)) {
                    intent.score += kw.length; // Longer matches = more specific
                }
            }
            // Special muscle check
            if (intent.id === 'muscle_workout' && intent.muscles) {
                const hasMuscle = intent.muscles.some(m => text.includes(m));
                const hasAction = intent.keywords.some(k => text.includes(k));
                if (hasMuscle && hasAction) intent.score += 20;
                else intent.score = 0;
            }
        }

        // Return highest scoring intent
        const best = intents.reduce((a, b) => a.score > b.score ? a : b);
        return best.score > 0 ? best.id : 'default';
    },


    // ===== PREFERENCE EXTRACTION =====
    extractPreferences(prompt, input) {
        const prefs = Storage.getUserPreferences();
        let changed = false;
        const timeMatch = prompt.match(/entreno (?:a las?|por la) (\d+|manana|tarde|noche)/i);
        if (timeMatch) { prefs.schedule = timeMatch[0]; changed = true; }
        const focusMatch = prompt.match(/(?:quiero|necesito|priorizar?|enfocarme en|mejorar) (?:mis? )?(pecho|espalda|hombros?|piernas?|brazos?|biceps|triceps|abdomen|gluteos?)/i);
        if (focusMatch) { prefs.focusMuscles = (prefs.focusMuscles ? prefs.focusMuscles + ', ' : '') + focusMatch[1]; changed = true; }
        const deadlineMatch = prompt.match(/(?:para|antes de|en) (\d+ (?:meses?|semanas?)|(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre))/i);
        if (deadlineMatch) { prefs.deadline = deadlineMatch[1]; changed = true; }
        if (changed) Storage.setUserPreferences(prefs);
    },

    // ===== HELPER: User metrics =====
    getUserMetrics(profile) {
        const w = profile.weight || 70;
        const h = profile.height || 175;
        const a = profile.age || 25;
        const g = profile.gender || 'hombre';
        const bmi = (w / ((h/100)**2)).toFixed(1);
        let bmr = g === 'mujer' ? 10*w + 6.25*h - 5*a - 161 : 10*w + 6.25*h - 5*a + 5;
        const tdee = Math.round(bmr * 1.55);
        return { w, h, a, g, bmi, bmr: Math.round(bmr), tdee };
    },


    // ===== RESPONSE GENERATORS =====

    genTodayWorkout(profile, periodWeek) {
        const days = profile.daysPerWeek || 4;
        const isDeload = periodWeek.deload;
        const rpe = periodWeek.rpe;
        const workoutsThisWeek = Storage.getWorkoutHistory().filter(w => {
            const d = new Date(w.date);
            const now = new Date();
            const monday = new Date(now);
            monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
            monday.setHours(0,0,0,0);
            return d >= monday;
        }).length;

        let templateKey = days <= 3 ? 'fullBody' : days === 4 ? 'upperLower' : days >= 5 ? 'ppl' : 'upperLower';
        const template = ROUTINE_TEMPLATES[templateKey];
        const dayIndex = workoutsThisWeek % template.days.length;
        const todayPlan = template.days[dayIndex];
        const prs = Storage.getPRs();

        const exercises = todayPlan.exercises.map(exId => {
            const ex = EXERCISES_DB.find(e => e.id === exId);
            if (!ex) return null;
            const pr = prs[exId];
            const suggestedWeight = pr ? Math.round(pr.weight * (periodWeek.intensity / 100)) : null;
            const sets = isDeload ? Math.max(2, ex.sets - 1) : ex.sets;
            return { ...ex, suggestedWeight, sets, targetRPE: rpe };
        }).filter(Boolean);

        let response = `**Entrenamiento de Hoy: ${todayPlan.name}**\nSemana ${Storage.getCurrentWeek()}/12 | Fase: ${periodWeek.phase} | RPE ${rpe}`;
        if (isDeload) response += `\n\n*Semana de deload: enfocate en tecnica, peso ligero, sin fallo.*`;
        
        response += '\n\n---\n';
        exercises.forEach((ex, i) => {
            const weightStr = ex.suggestedWeight ? `${ex.suggestedWeight}kg` : 'peso moderado';
            response += `\n**${i+1}. ${ex.name}**\n${ex.sets} series x ${ex.reps} | ${weightStr} | Descanso: ${ex.rest}s\n`;
        });

        response += `\n---\n\n**Duracion estimada:** ${isDeload ? '40-50' : '55-70'} min`;
        response += `\n\n**Instrucciones:**\n• Calienta 5-10 min antes\n• ${isDeload ? 'No llegues al fallo, enfocate en conexion mente-musculo' : 'Ultima serie de cada ejercicio cerca del fallo (RPE ' + rpe + ')'}\n• Registra todos tus pesos para progresar`;
        
        return response;
    },

    genMuscleWorkout(input, profile, periodWeek) {
        const muscleData = {
            pecho: { name: 'Pecho', ids: ['bench-press','incline-bench','dumbbell-fly','cable-crossover','dip-chest','push-ups'], tip: 'El pecho crece mejor con estiramiento bajo carga y presses en distintos angulos. 12-18 series/semana optimo.' },
            espalda: { name: 'Espalda', ids: ['pull-ups','barbell-row','lat-pulldown','seated-row','deadlift','face-pulls'], tip: 'Traccion vertical para ancho, horizontal para grosor. 15-22 series/semana.' },
            hombro: { name: 'Hombros', ids: ['ohp','lateral-raise','face-pulls','rear-delt-fly','front-raise','cable-lateral'], tip: 'El deltoides lateral es clave para amplitud. 15-25 series/semana de laterales.' },
            pierna: { name: 'Piernas', ids: ['squat','leg-press','romanian-deadlift','bulgarian-split','leg-extension','leg-curl','calf-raise'], tip: 'Profundidad completa en sentadilla > mas peso con medio rango.' },
            biceps: { name: 'Biceps', ids: ['barbell-curl','incline-curl','hammer-curl','preacher-curl','cable-curl'], tip: 'Crece mejor en estiramiento (curl inclinado). 10-15 series/semana directas.' },
            triceps: { name: 'Triceps', ids: ['close-grip-bench','overhead-extension','tricep-pushdown','dips','skull-crusher'], tip: 'La cabeza larga (la mas grande) se trabaja con overhead. 10-15 series/semana.' },
            gluteo: { name: 'Gluteos', ids: ['hip-thrust','bulgarian-split','romanian-deadlift','squat','cable-kickback'], tip: 'Hip thrust = mayor activacion. Combinar con ejercicios en estiramiento.' },
            abdomen: { name: 'Core', ids: ['hanging-leg-raise','cable-crunch','plank','russian-twist','ab-wheel'], tip: 'Los abs se revelan con deficit calorico. Para hipertrofia: carga progresiva, no 100 crunches.' },
            core: { name: 'Core', ids: ['hanging-leg-raise','cable-crunch','plank','russian-twist','ab-wheel'], tip: 'Los abs se revelan con deficit calorico. Para hipertrofia: carga progresiva.' }
        };

        let target = null;
        for (const [key, data] of Object.entries(muscleData)) {
            if (input.includes(key)) { target = data; break; }
        }
        if (!target) target = muscleData.pecho;

        const prs = Storage.getPRs();
        const exercises = target.ids.map(id => {
            const ex = EXERCISES_DB.find(e => e.id === id);
            if (!ex) return null;
            const pr = prs[id];
            const weight = pr ? Math.round(pr.weight * (periodWeek.intensity/100)) : null;
            return { ...ex, weight };
        }).filter(Boolean).slice(0, 6);

        let response = `**Sesion de ${target.name}**\nSemana ${Storage.getCurrentWeek()}/12 | RPE ${periodWeek.rpe}\n\n*${target.tip}*\n\n---\n`;
        
        exercises.forEach((ex, i) => {
            const weightStr = ex.weight ? `~${ex.weight}kg` : `RPE ${periodWeek.rpe}`;
            const priority = i < 2 ? ' (prioritario)' : '';
            response += `\n**${i+1}. ${ex.name}**${priority}\n${ex.sets} series x ${ex.reps} | ${weightStr} | Descanso: ${ex.rest}s\n`;
        });

        response += `\n---\n\n**Protocolo:**\n• Ejercicios 1-2: compuestos, maximo esfuerzo\n• Ejercicios 3+: aislamiento, pump y conexion mente-musculo\n• Ultima serie: tecnica de intensidad (drop set o rest-pause)`;
        return response;
    },


    genExerciseInfo(input, profile) {
        const exerciseMatch = EXERCISES_DB.find(ex => {
            const nameNorm = ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return input.includes(nameNorm) || input.includes(ex.id.replace(/-/g, ' '));
        });

        if (exerciseMatch) {
            const pr = Storage.getPRs()[exerciseMatch.id];
            let r = `**${exerciseMatch.name}**\n\n`;
            r += `Tipo: ${exerciseMatch.category === 'compound' ? 'Compuesto' : 'Aislamiento'} | Musculo: ${exerciseMatch.muscle} | Equipo: ${exerciseMatch.equipment}\n`;
            if (pr) r += `Tu PR: **${pr.weight}kg**\n`;
            r += `\n**Ejecucion:**\n${exerciseMatch.description}\n`;
            r += `\n**Parametros optimos:**\n• Series: ${exerciseMatch.sets} | Reps: ${exerciseMatch.reps} | Descanso: ${exerciseMatch.rest}s\n• Tempo: 2-0-1-0 (2s excentrica, 1s concentrica)\n`;
            r += `\n**Claves de tecnica:**\n${exerciseMatch.tips.map(t => '• ' + t).join('\n')}\n`;
            const alts = EXERCISES_DB.filter(e => e.muscle === exerciseMatch.muscle && e.id !== exerciseMatch.id).slice(0, 3);
            if (alts.length) r += `\n**Alternativas:** ${alts.map(e => e.name).join(', ')}`;
            return r;
        }

        // Find by muscle
        const muscleMap = {pecho:'Pecho',espalda:'Espalda',hombro:'Hombros',pierna:'Piernas',biceps:'Biceps',triceps:'Triceps',core:'Core',abdomen:'Core'};
        let targetMuscle = null;
        for (const [k,v] of Object.entries(muscleMap)) { if (input.includes(k)) { targetMuscle = v; break; } }

        if (targetMuscle) {
            const exs = EXERCISES_DB.filter(e => e.muscle === targetMuscle).sort((a,b) => a.category === 'compound' ? -1 : 1);
            let r = `**Mejores ejercicios para ${targetMuscle}**\n\n`;
            exs.slice(0, 8).forEach((ex, i) => {
                r += `**${i+1}. ${ex.name}** (${ex.category === 'compound' ? 'compuesto' : 'aislamiento'})\n${ex.sets}x${ex.reps} | ${ex.equipment}\n\n`;
            });
            r += `**Recomendacion:** 2 compuestos + 2-3 aislamientos por sesion. Total semanal: 12-18 series directas.`;
            return r;
        }

        return `Dime que ejercicio o musculo te interesa y te doy informacion detallada: tecnica, parametros, alternativas y como incluirlo en tu rutina.`;
    },

    genFullProgram(profile, periodWeek, input) {
        const days = profile.daysPerWeek || 4;
        let templateKey;
        if (input.includes('ppl') || input.includes('push pull')) templateKey = 'ppl';
        else if (input.includes('upper') || input.includes('torso')) templateKey = 'upperLower';
        else if (input.includes('full body') || input.includes('cuerpo completo')) templateKey = 'fullBody';
        else if (days <= 3) templateKey = 'fullBody';
        else if (days === 4) templateKey = 'upperLower';
        else if (days === 5) templateKey = 'bro';
        else templateKey = 'ppl';

        const template = ROUTINE_TEMPLATES[templateKey];
        let r = `**Programa: ${template.name}**\n${profile.name || 'Atleta'} | ${profile.level || 'intermedio'} | ${days} dias/semana\nSemana ${Storage.getCurrentWeek()}/12 | Fase: ${periodWeek.phase}\n\n---\n`;

        template.days.forEach((day, i) => {
            const exercises = day.exercises.map(exId => {
                const ex = EXERCISES_DB.find(e => e.id === exId);
                return ex ? `  • ${ex.name} - ${ex.sets}x${ex.reps}` : '';
            }).filter(Boolean).join('\n');
            r += `\n**Dia ${i+1}: ${day.name}**\n${exercises}\n`;
        });

        r += `\n---\n\n**Progresion (Fase: ${periodWeek.phase}):**\n• Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}\n`;
        r += periodWeek.deload ? '• Semana de DELOAD: reduce peso al 60%, enfocate en tecnica\n' : '• Intenta +2.5kg en compuestos si completaste todas las reps\n';
        r += `\n**Reglas:**\n1. Nunca faltes 2 dias seguidos\n2. Si no progresas en peso: +1 rep, luego +1 serie, luego cambia ejercicio\n3. Proteina: ${Math.round((profile.weight||70)*2)}g/dia\n4. Duerme 7-9h`;
        return r;
    },


    genNutrition(input, profile) {
        const m = this.getUserMetrics(profile);
        const goal = profile.goal || 'ganar musculo';
        let targetCals, protein, carbs, fats, strategy;

        if (goal.includes('perder') || goal.includes('definir') || goal.includes('bajar')) {
            targetCals = Math.round(m.tdee - 400);
            protein = Math.round(m.w * 2.3);
            fats = Math.round(m.w * 0.85);
            carbs = Math.round((targetCals - protein*4 - fats*9) / 4);
            strategy = 'Deficit calorico moderado (-400kcal). Proteina alta para preservar musculo.';
        } else if (goal.includes('ganar') || goal.includes('volumen') || goal.includes('musculo')) {
            targetCals = Math.round(m.tdee + 300);
            protein = Math.round(m.w * 2);
            fats = Math.round(m.w * 1);
            carbs = Math.round((targetCals - protein*4 - fats*9) / 4);
            strategy = 'Lean bulk (+300kcal). Superavit controlado para minimizar grasa.';
        } else {
            targetCals = m.tdee;
            protein = Math.round(m.w * 2);
            fats = Math.round(m.w * 1);
            carbs = Math.round((targetCals - protein*4 - fats*9) / 4);
            strategy = 'Mantenimiento/recomposicion.';
        }

        let r = `**Plan Nutricional Personalizado**\n${m.w}kg | ${m.h}cm | ${m.a} anos | Objetivo: ${goal}\nEstrategia: ${strategy}\n\n---\n\n`;
        r += `**Tus numeros (Mifflin-St Jeor):**\n• BMR: ${m.bmr} kcal | TDEE: ${m.tdee} kcal\n• **Objetivo diario: ${targetCals} kcal**\n\n`;
        r += `**Macronutrientes:**\n• Proteina: **${protein}g** (${Math.round(protein*4/targetCals*100)}%)\n• Carbohidratos: **${carbs}g** (${Math.round(carbs*4/targetCals*100)}%)\n• Grasas: **${fats}g** (${Math.round(fats*9/targetCals*100)}%)\n\n`;
        r += `**Distribucion en 4-5 comidas:**\n`;
        r += `• Desayuno (~${Math.round(targetCals*0.25)} kcal): ${protein > 150 ? '40' : '30'}g proteina + carbos complejos\n`;
        r += `• Almuerzo (~${Math.round(targetCals*0.30)} kcal): ${protein > 150 ? '50' : '40'}g proteina + carbos + verduras\n`;
        r += `• Pre-entreno (~${Math.round(targetCals*0.15)} kcal): 30g proteina + carbos rapidos\n`;
        r += `• Cena (~${Math.round(targetCals*0.20)} kcal): 40g proteina + verduras + grasas\n`;
        r += `• Snack (~${Math.round(targetCals*0.10)} kcal): proteina + frutos secos\n\n`;
        r += `**Reglas:**\n1. ${protein}g de proteina no son negociables\n2. Pesa tu comida la primera semana\n3. Mas carbos en dias de entreno, menos en descanso\n4. Verduras en cada comida principal\n5. Hidratacion: ${Math.round(m.w*0.035)}L/dia`;
        return r;
    },

    genMealIdeas(input, profile) {
        const m = this.getUserMetrics(profile);
        const goal = profile.goal || 'ganar musculo';
        const targetCals = goal.includes('perder') ? Math.round(m.tdee - 400) : goal.includes('ganar') ? Math.round(m.tdee + 300) : m.tdee;

        let meal = 'desayuno';
        if (input.includes('almuerzo') || input.includes('comida')) meal = 'almuerzo';
        else if (input.includes('cena')) meal = 'cena';
        else if (input.includes('pre entreno') || input.includes('antes de entrenar')) meal = 'pre-entreno';
        else if (input.includes('post entreno') || input.includes('despues de entrenar')) meal = 'post-entreno';
        else if (input.includes('snack') || input.includes('merienda')) meal = 'snack';

        const meals = {
            'desayuno': { cals: Math.round(targetCals*0.25), options: [
                '4 claras + 2 huevos + 80g avena + platano (P:40g C:65g G:12g)',
                'Yogur griego 250g + granola + frutos rojos + 1 scoop whey (P:35g C:45g G:10g)',
                'Tostadas integrales + aguacate + pavo + huevo (P:30g C:35g G:16g)',
                'Pancakes de avena+claras+platano + mantequilla de mani (P:35g C:55g G:15g)',
                'Smoothie: whey + platano + avena + leche + cacao (P:40g C:50g G:12g)'
            ]},
            'almuerzo': { cals: Math.round(targetCals*0.30), options: [
                '200g pechuga + 100g arroz + brocoli + aceite oliva (P:48g C:80g G:12g)',
                '180g salmon + quinoa + aguacate + edamame (P:42g C:55g G:22g)',
                '100g pasta integral + 200g carne magra + salsa tomate (P:50g C:85g G:15g)',
                '200g pollo + arroz + verduras salteadas + salsa teriyaki (P:45g C:75g G:10g)'
            ]},
            'cena': { cals: Math.round(targetCals*0.20), options: [
                '180g salmon + ensalada grande + aceite oliva + limon (P:38g C:10g G:18g)',
                '4 huevos + espinacas + champinones + queso feta (P:32g C:8g G:22g)',
                '200g atun + aguacate + pepino + arroz integral (P:42g C:35g G:15g)',
                'Wrap integral + 150g pavo + hummus + verduras (P:35g C:30g G:12g)'
            ]},
            'pre-entreno': { cals: Math.round(targetCals*0.15), options: [
                '1 scoop whey + platano + 40g avena + miel (P:30g C:55g G:5g)',
                '2 rebanadas pan + 100g pavo + platano (P:28g C:50g G:4g)',
                'Yogur + granola + platano + miel (P:20g C:60g G:8g)'
            ]},
            'post-entreno': { cals: Math.round(targetCals*0.20), options: [
                'Whey + platano + avena + leche + creatina (P:40g C:60g G:8g)',
                '150g pollo + arroz blanco + fruta (P:38g C:70g G:8g)',
                '80g cereal + leche + whey + platano (P:35g C:65g G:6g)'
            ]},
            'snack': { cals: Math.round(targetCals*0.10), options: [
                '30g frutos secos + fruta + yogur griego (P:15g C:25g G:12g)',
                'Batido: whey + platano + mantequilla mani (P:30g C:35g G:10g)',
                '2 tortitas arroz + mantequilla mani + platano (P:8g C:30g G:10g)'
            ]}
        };

        const data = meals[meal] || meals['desayuno'];
        let r = `**Ideas de ${meal.charAt(0).toUpperCase() + meal.slice(1)} (~${data.cals} kcal)**\n\n`;
        data.options.forEach((opt, i) => { r += `${i+1}. ${opt}\n\n`; });
        r += `Ajusta porciones segun tus macros objetivo. Preguntame por otra comida si necesitas mas ideas.`;
        return r;
    },


    genSupplements(input, profile) {
        const w = profile.weight || 70;

        if (input.includes('creatina')) {
            return `**Creatina Monohidrato**\n\nEl suplemento mas estudiado y efectivo para rendimiento y musculo.\n\n**Que hace:**\n• Aumenta fosfocreatina muscular = mas ATP = mas fuerza y reps\n• Mejora recuperacion entre series\n• Beneficios cognitivos comprobados\n\n**Dosis:** 5g/dia, todos los dias. Sin fase de carga necesaria.\n\n**Respuestas rapidas:**\n• Fase de carga: NO necesaria (5g/dia x 3-4 semanas = saturacion)\n• Cuando tomarla: Da igual, consistencia importa mas\n• Retencion: 1-3kg agua intramuscular (te ves mas lleno, no hinchado)\n• Seguridad: El suplemento mas estudiado de la historia, sin efectos adversos\n• Ciclar: NO, usala indefinidamente\n• Cual comprar: Monohidrato en polvo, la mas barata funciona igual\n• Pelo: NO hay evidencia solida de perdida\n\nCosto: ~$15-20/mes por +5-10% rendimiento. Mejor ROI en suplementacion.`;
        }

        if (input.includes('pre-entreno') || input.includes('pre entreno')) {
            return `**Pre-Entrenos**\n\nProbablemente NO lo necesitas. Un cafe + platano funciona igual.\n\n**Ingredientes que SI funcionan (dosis efectiva):**\n1. Cafeina: ${Math.round(w*4)}mg (3-6mg/kg) - mejora fuerza y focus\n2. Citrulina malato: 6-8g - pump y resistencia\n3. Beta-alanina: 3-5g - hormigueo, mejora sets largos\n4. Creatina: 5g - ya sabes\n\n**Ingredientes inutiles:**\n• Blends propietarios (esconden dosis)\n• BCAAs (ya estan en la proteina)\n• Dosis sub-clinicas de todo\n\n**Opciones:**\n1. Hacerlo tu: Cafeina + Citrulina + Creatina (~$25/mes)\n2. Comprado: busca dosis transparentes\n3. El clasico: 1-2 cafes + platano 30min antes\n\nRegla: no dependas del pre. Si no puedes entrenar sin el, duermes o comes mal.`;
        }

        let r = `**Guia de Suplementacion (${w}kg)**\n\nOrdenada por evidencia cientifica e importancia real:\n\n---\n\n`;
        r += `**TIER 1 - Imprescindibles:**\n\n`;
        r += `1. **Creatina Monohidrato** - 5g/dia siempre\n   +5-10% fuerza, +1-2kg musculo en 12 semanas | ~$15/mes\n\n`;
        r += `2. **Proteina Whey** - ${Math.round(w*0.5)}g/dia (si no llegas con comida)\n   Tu objetivo: ${Math.round(w*2)}g proteina total/dia\n\n`;
        r += `3. **Vitamina D3** - 2000-4000 IU/dia\n   70%+ de la poblacion es deficiente. Afecta rendimiento y hormonas.\n\n`;
        r += `**TIER 2 - Muy utiles:**\n\n`;
        r += `4. **Magnesio glicinato** - 400mg antes de dormir (mejora sueno)\n`;
        r += `5. **Omega-3** - 2-3g/dia (antiinflamatorio, salud cardiovascular)\n`;
        r += `6. **Cafeina** - ${Math.round(w*4)}mg pre-entreno (+5-10% rendimiento)\n\n`;
        r += `**NO malgastes en:** BCAAs, quemadores de grasa, boosters de testosterona, glutamina.\n\n`;
        r += `**Prioridad real:** Sueno > Nutricion > Entreno > Suplementos\nLos suplementos son el ultimo 5% de resultados.`;
        return r;
    },

    genInjuryAdvice(input, profile) {
        let area = 'general';
        if (input.includes('hombro')) area = 'hombro';
        else if (input.includes('rodilla')) area = 'rodilla';
        else if (input.includes('espalda') || input.includes('lumbar')) area = 'espalda';
        else if (input.includes('codo')) area = 'codo';
        else if (input.includes('muneca')) area = 'muneca';

        const advice = {
            hombro: { title: 'Hombro', avoid: 'Press militar detras del cuello, aperturas muy abiertas, dips profundos', replace: 'Mancuernas (mas libertad), landmine press, press agarre neutro', rehab: 'Face pulls 3x15 diarios, rotaciones externas con banda, CARS de hombro', rule: 'Si duele DURANTE = para. Si duele DESPUES = reduce peso 50% por 2 semanas.' },
            rodilla: { title: 'Rodilla', avoid: 'Sentadillas con rebote, extension de piernas muy pesada, saltos con peso', replace: 'Box squat, leg press ROM controlado, step-ups, isometricos', rehab: 'Sentadilla isometrica en pared 3x30s, VMO con mini-banda, foam roller', rule: 'El dolor de rodilla suele mejorar con movimiento CONTROLADO, no con reposo total.' },
            espalda: { title: 'Espalda baja', avoid: 'Peso muerto con espalda redondeada, good mornings pesados, crunches', replace: 'Hip hinge con kettlebell, RDL con ROM reducido, bird dog, pallof press', rehab: 'McGill Big 3 (curl-up, side plank, bird dog), cat-cow, glute bridges', rule: 'La espalda baja odia la flexion bajo carga. Bracing siempre.' },
            codo: { title: 'Codo', avoid: 'Curls muy pesados con mala forma, extensiones agresivas, demasiado volumen', replace: 'Reduce frecuencia de brazos, usa bandas, excentricos lentos', rehab: 'Wrist curls excentricos, masaje profundo en antebrazo', rule: 'Problemas de codo = demasiado volumen de brazos. Reduce series totales.' },
            muneca: { title: 'Muneca', avoid: 'Front squats agarre completo, curls barra recta, push-ups planas', replace: 'Wrist wraps, barra EZ, push-ups en punos, agarre neutro', rehab: 'Extensiones de muneca con banda ligera, rice bucket', rule: 'Usa wrist wraps en ejercicios pesados. Calienta munecas antes.' },
            general: { title: 'General', avoid: 'Cualquier ejercicio que cause dolor agudo', replace: 'Busca variaciones sin dolor - casi siempre hay alternativa', rehab: 'Movilidad 10min diarios, foam roller, calentamiento progresivo', rule: 'DOLOR no es DOMS. DOMS = difuso, 24-72h. Lesion = localizado, agudo, empeora.' }
        };

        const a = advice[area];
        let r = `**Dolor/Molestia: ${a.title}**\n\n`;
        r += `*Disclaimer: esto no reemplaza a un fisioterapeuta. Si el dolor es intenso o persiste >2 semanas, consulta un profesional.*\n\n---\n\n`;
        r += `**Evita:** ${a.avoid}\n\n`;
        r += `**Reemplaza con:** ${a.replace}\n\n`;
        r += `**Rehabilitacion:** ${a.rehab}\n\n`;
        r += `**Regla:** ${a.rule}\n\n`;
        r += `**Protocolo de vuelta:**\n1. Semana 1-2: solo movimientos sin dolor, 40-50% peso\n2. Semana 3-4: gradualmente a 70%\n3. Semana 5+: normalidad si no hay dolor`;
        return r;
    },


    genRecovery(profile, periodWeek) {
        const w = profile.weight || 70;
        let r = `**Guia de Recuperacion Optima**\n\nLa recuperacion es donde creces. Entrenas para estimular, comes para construir, duermes para crecer.\n\n---\n\n`;
        if (periodWeek.deload) r += `*Estas en semana de deload. Reduce peso al 55-60%, solo 2 series por ejercicio, sin fallo.*\n\n---\n\n`;
        r += `**Sueno (30% de tus resultados):**\n• 7-9 horas, sin negociar\n• Misma hora todos los dias\n• Cuarto oscuro, 18-20C, sin pantallas 45min antes\n• Suplementos: Magnesio 400mg + Ashwagandha 600mg\n\n`;
        r += `**Nutricion para recovery:**\n• Proteina: ${Math.round(w*2)}g en 4-5 tomas\n• Post-entreno: 30-40g whey + carbohidratos\n• Antes de dormir: 30-40g caseina o yogur griego\n• Hidratacion: ${Math.round(w*0.04)}L/dia\n\n`;
        r += `**Recuperacion activa:**\n• Caminar 20-30min (flujo sanguineo sin estres)\n• Foam rolling 5-10min\n• Estiramientos ligeros\n• Sauna/bano caliente\n\n`;
        r += `**Senales de sobreentrenamiento:**\n• Rendimiento baja 2+ sesiones seguidas\n• Fatiga al despertar\n• Irritabilidad constante\n• Dolor articular\n• Enfermarse frecuentemente\n\n`;
        r += `**Si estas sobreentrenado:** 3-5 dias de descanso total, come en mantenimiento, duerme 9+ horas. Vuelve al 60%.`;
        return r;
    },

    genCardio(profile, input) {
        const w = profile.weight || 70;
        const goal = profile.goal || 'ganar musculo';
        const isDeficit = goal.includes('perder') || goal.includes('definir');

        let r = `**Cardio para ${isDeficit ? 'Definicion' : 'Ganancia Muscular'}**\n${w}kg | Objetivo: ${goal}\n\n---\n\n`;
        r += `**LISS (baja intensidad) - Recomendado:**\n• ${isDeficit ? '4-5' : '2-3'} sesiones/semana, 20-40 min\n• Caminar rapido, bicicleta suave, eliptica\n• FC: 120-140 bpm | Quema: ~${Math.round(w*0.06*30)} kcal/30min\n• No interfiere con recuperacion muscular\n\n`;
        r += `**HIIT (alta intensidad):**\n• ${isDeficit ? '1-2' : '0-1'} sesiones/semana MAXIMO\n• 15-20 min: 30s sprint / 60s descanso\n• Quema mas en menos tiempo pero es muy demandante\n• No hacer el mismo dia que piernas\n\n`;
        r += `**El hack definitivo:**\n10.000 pasos/dia = ~400 kcal extra sin cansarte para el gym.\nSube escaleras, camina al trabajo, pasea despues de comer.\n\n`;
        r += `**Errores:**\n• Cardio antes de pesas = peor rendimiento\n• Compensar mala dieta con cardio = nunca funciona\n• HIIT diario = sobreentrenamiento`;
        return r;
    },

    genProgress(profile) {
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const week = Storage.getCurrentWeek();
        const last7 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 7*24*60*60*1000));
        const last30 = workouts.filter(w => new Date(w.date) > new Date(Date.now() - 30*24*60*60*1000));
        const expectedWorkouts = week * (profile.daysPerWeek || 4);
        const adherence = expectedWorkouts > 0 ? Math.round(workouts.length / expectedWorkouts * 100) : 0;

        const prList = Object.entries(prs).map(([id, data]) => {
            const ex = EXERCISES_DB.find(e => e.id === id);
            return { name: ex ? ex.name : id, weight: data.weight, date: data.date };
        }).sort((a,b) => new Date(b.date) - new Date(a.date));

        let r = `**Reporte de Progreso**\nSemana ${week}/12 | ${profile.name || 'Atleta'}\n\n---\n\n`;
        r += `**Actividad:**\n• Total: ${workouts.length} entrenamientos\n• Ultimos 7 dias: ${last7.length} sesiones\n• Ultimos 30 dias: ${last30.length} sesiones\n• Adherencia: **${adherence}%** ${adherence >= 80 ? '(excelente)' : adherence >= 60 ? '(buena)' : '(necesita mejorar)'}\n\n`;
        
        if (prList.length > 0) {
            r += `**PRs recientes:**\n`;
            prList.slice(0, 5).forEach(pr => { r += `• ${pr.name}: **${pr.weight}kg**\n`; });
            r += '\n';
        }

        r += `**Proxima semana:**\n1. ${last7.length < (profile.daysPerWeek||4) ? 'Completa todas las sesiones' : 'Mantiene tu adherencia'}\n2. Intenta superar al menos 1 PR\n3. Registra tu peso 3 veces\n4. Cumple tus macros de proteina`;
        return r;
    },

    genAssessment(profile, periodWeek) {
        const m = this.getUserMetrics(profile);
        const workouts = Storage.getWorkoutHistory();
        const prs = Storage.getPRs();
        const week = Storage.getCurrentWeek();
        const benchPR = prs['bench-press'] ? prs['bench-press'].weight : 0;
        const squatPR = prs['squat'] ? prs['squat'].weight : 0;
        const deadliftPR = prs['deadlift'] ? prs['deadlift'].weight : 0;
        const expectedWorkouts = week * (profile.daysPerWeek || 4);
        const adherence = expectedWorkouts > 0 ? Math.round(workouts.length / expectedWorkouts * 100) : 0;

        let strengthLevel = 'Principiante';
        if (benchPR/m.w > 1.5) strengthLevel = 'Avanzado';
        else if (benchPR/m.w > 1.0) strengthLevel = 'Intermedio';
        else if (benchPR/m.w > 0.7) strengthLevel = 'Principiante avanzado';

        let r = `**Valoracion Completa**\n\n---\n\n`;
        r += `**Composicion corporal:**\n• ${m.w}kg | ${m.h}cm | IMC: ${m.bmi} ${parseFloat(m.bmi)<25?'(normal)':parseFloat(m.bmi)<30?'(sobrepeso)':'(alto)'}\n• Grasa estimada: ${parseFloat(m.bmi)<22?'10-14%':parseFloat(m.bmi)<25?'14-18%':parseFloat(m.bmi)<28?'18-24%':'24%+'}\n\n`;
        
        if (benchPR || squatPR || deadliftPR) {
            r += `**Fuerza:**\n`;
            if (benchPR) r += `• Press banca: ${benchPR}kg (${(benchPR/m.w).toFixed(1)}x peso corporal)\n`;
            if (squatPR) r += `• Sentadilla: ${squatPR}kg (${(squatPR/m.w).toFixed(1)}x peso corporal)\n`;
            if (deadliftPR) r += `• Peso muerto: ${deadliftPR}kg (${(deadliftPR/m.w).toFixed(1)}x peso corporal)\n`;
            r += `• Nivel: **${strengthLevel}**\n\n`;
        }

        r += `**Adherencia:** ${adherence}% (${workouts.length}/${expectedWorkouts} entrenamientos)\n\n`;
        r += `**Plan de accion (proximas 4 semanas):**\n`;
        if (profile.goal && profile.goal.includes('perder')) {
            r += `1. Calorias: ${Math.round(m.w*26)} kcal/dia con ${Math.round(m.w*2.2)}g proteina\n2. Mantiene intensidad, reduce volumen ligeramente\n3. Cardio: 3-4 sesiones LISS 20-30min\n4. Peso objetivo: ~${(m.w-2).toFixed(1)}kg`;
        } else {
            r += `1. Calorias: ${Math.round(m.w*34)} kcal/dia con ${Math.round(m.w*2)}g proteina\n2. Progresion en compuestos +2.5kg/semana\n3. Aumenta 1-2 series/musculo si te recuperas\n4. Peso objetivo: ~${(m.w+1.5).toFixed(1)}kg`;
        }
        return r;
    },


    genPlateau(profile, periodWeek) {
        const week = Storage.getCurrentWeek();
        let r = `**Como Romper un Estancamiento**\n\nEs normal. Le pasa a todos. No significa que algo esta mal, significa que necesitas un ajuste.\n\n---\n\n`;
        r += `**Diagnostico - revisa en orden:**\n1. Duermes 7-9 horas? (Sin sueno no creces)\n2. Comes suficiente? (Min ${Math.round((profile.weight||70)*2)}g proteina)\n3. Has descansado? (Si llevas +6 semanas sin deload, toma una)\n4. Llevas tracking? (Si no anotas, no sabes si progresas)\n5. Tu tecnica es buena? (A veces basta mejorar ejecucion)\n\n`;
        r += `**Soluciones (en orden):**\n\n`;
        r += `**1. Deload (1 semana):** Entrena al 50-60%. La fatiga acumulada puede frenarte.\n\n`;
        r += `**2. Cambia estimulo:** Rota ejercicios que llevas +6 semanas (ej: barra a mancuernas)\n\n`;
        r += `**3. Manipula variables:** Si siempre haces 3x10, prueba 5x5 o 3x15-20\n\n`;
        r += `**4. Sube volumen:** +1-2 series por ejercicio estancado\n\n`;
        r += `**5. Tecnicas de intensidad:** Drop sets, rest-pause, myo-reps en la ultima serie\n\n`;
        r += `---\n\n`;
        r += week >= 5 && !periodWeek.deload ? 
            `**Mi recomendacion:** Llevas ${week} semanas. Toma una semana de deload y volveras mas fuerte.` :
            `**Mi recomendacion:** Cambia ejercicios de los musculos estancados y sube 2 series. Dale 3 semanas.`;
        return r;
    },

    genTimeline(input, profile) {
        const m = this.getUserMetrics(profile);
        const goal = profile.goal || 'ganar musculo';
        const level = profile.level || 'intermedio';
        let weeks = 12;
        const monthMatch = input.match(/(\d+)\s*mes/);
        const weekMatch = input.match(/(\d+)\s*semana/);
        if (monthMatch) weeks = parseInt(monthMatch[1]) * 4;
        if (weekMatch) weeks = parseInt(weekMatch[1]);

        let muscleGain = level === 'principiante' ? (weeks/4)*0.8 : level === 'intermedio' ? (weeks/4)*0.4 : (weeks/4)*0.2;
        let fatLoss = (weeks/4) * 1.5;

        let r = `**Plan con Timeline: ${weeks} semanas**\n${m.w}kg | ${level} | Objetivo: ${goal}\n\n---\n\n`;
        r += `**Resultados realistas en ${weeks} semanas:**\n`;
        if (goal.includes('perder') || goal.includes('definir')) {
            r += `• Perdida de grasa: ~${Math.round(fatLoss)}kg\n• Musculo: mantener todo (o ganar algo si eres nuevo)\n• Visual: cambio notable desde semana 4\n\n`;
        } else {
            r += `• Ganancia muscular: ~${muscleGain.toFixed(1)}kg puro\n• Fuerza: +${level==='principiante'?'30-50':'10-20'}% en basicos\n• Visual: ropa queda diferente desde semana 4-6\n\n`;
        }
        r += `**Fases:**\n`;
        r += `• Semanas 1-4: Adaptacion, crear habito, progresion lineal\n`;
        r += `• Semanas 5-8: Acumulacion, subir volumen e intensidad\n`;
        if (weeks > 8) r += `• Semanas 9-${weeks}: Intensificacion, tecnicas avanzadas, pico\n`;
        r += `\n**Acciones inmediatas:**\n`;
        r += `1. Calorias: ${goal.includes('perder')?Math.round(m.w*26):Math.round(m.w*35)} kcal/dia\n`;
        r += `2. Proteina: ${Math.round(m.w*2.2)}g/dia sin excepcion\n`;
        r += `3. Entrena ${profile.daysPerWeek||4}x/semana, nunca faltes\n`;
        r += `4. Fotos cada 2 semanas (misma luz, misma pose)\n5. Duerme 7-9h cada noche`;
        return r;
    },

    genComparison(input, profile) {
        if (input.includes('mancuerna') && (input.includes('barra') || input.includes('vs'))) {
            return `**Barra vs Mancuernas**\n\n• **Barra:** mayor carga posible, progresion facil (+2.5kg), pero rango fijo\n• **Mancuernas:** mayor rango de movimiento, trabajo independiente, mas estabilizacion\n\n**Veredicto:** Usa ambos. Barra para basicos pesados (bench, squat, deadlift). Mancuernas para accesorios y mayor estiramiento muscular.\n\nPara hipertrofia pura, las mancuernas pueden ser mejores (mas ROM, mas activacion) pero no puedes ir tan pesado.`;
        }
        if (input.includes('maquina') && (input.includes('peso libre') || input.includes('libre'))) {
            return `**Peso Libre vs Maquinas**\n\n• **Peso libre:** mayor activacion (estabilizadores), transferencia funcional, pero requiere tecnica\n• **Maquinas:** seguras, excelente aislamiento, facil progresar\n\n**Veredicto:** 60-70% peso libre (base) + 30-40% maquinas (aislar y rematar).\nEmpieza con compuestos libres cuando estas fresco, termina con maquinas cuando estas cansado.`;
        }
        if (input.includes('volumen') || input.includes('definicion') || input.includes('bulk') || input.includes('cut')) {
            const bmi = parseFloat(this.getUserMetrics(profile).bmi);
            let rec = bmi > 25 ? 'Empieza con cut de 8-12 semanas.' : bmi < 20 ? 'Lean bulk de 16-20 semanas.' : 'Puedes hacer recomposicion con alta proteina.';
            return `**Volumen vs Definicion**\n\n**Volumen si:** <15% grasa, principiante, o llevas +6 semanas en deficit\n**Definicion si:** >18-20% grasa, llevas +4 meses en volumen, te ves hinchado\n**Recomposicion si:** principiante, o vuelves despues de un paron\n\n**Para ti (IMC ${this.getUserMetrics(profile).bmi}):** ${rec}`;
        }
        return `Dime que comparacion necesitas y te doy una respuesta basada en evidencia. Ejemplos: "barra vs mancuernas", "volumen o definicion", "3 o 4 dias", "cardio antes o despues de pesas".`;
    },

    genAesthetic(input, profile) {
        const w = profile.weight || 70;
        if (input.includes('abdomen') || input.includes('six pack') || input.includes('marcar')) {
            return `**Como Marcar Abdominales**\n\nLos abs se revelan con dieta, se construyen con entreno.\nPara verlos: ~12-15% grasa (hombres), 18-22% (mujeres).\n\n**Plan:**\n1. **Nutricion (80%):** Deficit de 400-500kcal, come ${Math.round(w*25)} kcal/dia, proteina ${Math.round(w*2.2)}g\n2. **Entrenamiento de abs (20%):** 2-3x/semana con carga progresiva:\n   • Hanging leg raises: 3x10-15\n   • Cable crunches: 3x12-15\n   • Ab wheel: 3x8-12\n   • NO hagas oblicuos con peso lateral (ensancha cintura)\n3. **Cardio:** 10.000 pasos/dia + 2-3 LISS\n\n**Timeline:** ${w>80?'12-16':w>70?'8-12':'4-8'} semanas con disciplina.`;
        }
        if (input.includes('brazo') || input.includes('biceps')) {
            return `**Brazos Grandes**\n\nEl triceps es 2/3 del brazo. No solo hagas biceps.\n\n**Biceps:**\n• Curl inclinado 45: 3x10-12 (maximo estiramiento)\n• Curl barra EZ: 3x8-10 (mas peso)\n• Curl martillo: 3x10-12 (braquial = grosor)\n\n**Triceps:**\n• Extension overhead: 3x10-12 (cabeza larga)\n• Press cerrado: 3x8-10 (compound)\n• Pushdown cuerda: 3x12-15 (lateral)\n\nFrecuencia: 2-3x/semana | Total: 10-14 series directas por musculo`;
        }
        if (input.includes('espalda') || input.includes('anch')) {
            return `**Espalda Ancha (V-Taper)**\n\nV-taper = dorsales anchos + hombros anchos + cintura estrecha.\n\n**Para ancho (vertical):**\n• Dominadas pronadas anchas: 4x6-10\n• Jalon al pecho ancho: 3x10-12\n• Pullover cable: 3x12-15\n\n**Para grosor (horizontal):**\n• Remo barra: 4x8-10\n• Remo sentado neutro: 3x10-12\n• Face pulls: 3x15-20\n\nClave: "Tira con los codos, no con las manos." Volumen: 16-22 series/semana. Frecuencia: 2x/semana min.`;
        }
        return `**Mejora Estetica**\n\nMusculos con mayor impacto visual (en orden):\n1. Hombros anchos (laterales, laterales, laterales)\n2. Espalda ancha (dominadas + remos)\n3. Pecho desarrollado (press inclinado + aperturas)\n4. Brazos (triceps overhead + curls inclinados)\n5. Core definido (deficit calorico + entreno con carga)\n\nDime que parte quieres priorizar y te doy el plan detallado.`;
    },


    genTrainingScience(input, profile, periodWeek) {
        if (input.includes('cuantas series') || input.includes('volumen')) {
            return `**Volumen Optimo por Musculo (series/semana)**\n\nBasado en meta-analisis de Schoenfeld y recomendaciones de Israetel:\n\n• Pecho: 12-18 (optimo) | 6 (minimo mantener)\n• Espalda: 14-22 | 8\n• Hombros lateral: 15-22 | 6\n• Cuadriceps: 12-18 | 6\n• Isquiotibiales: 10-14 | 4\n• Biceps: 10-14 | 4\n• Triceps: 8-14 | 4\n• Gluteos: 10-16 | 4\n\nPara tu nivel (${profile.level||'intermedio'}): empieza por el rango bajo y sube 1-2 series/semana hasta que no te recuperes.`;
        }
        if (input.includes('rpe') || input.includes('rir') || input.includes('fallo')) {
            return `**RPE / RIR y Proximidad al Fallo**\n\n• RPE 10 / RIR 0: Fallo muscular total\n• RPE 9 / RIR 1: Te queda 1 rep segura\n• RPE 8 / RIR 2: Te quedan 2 reps\n• RPE 7 / RIR 3: Moderadamente dificil\n\n**Tu fase actual: RPE ${periodWeek.rpe}**\n\n**Debo ir al fallo?**\n${profile.level==='principiante' ? 'Como principiante: nunca al fallo. RPE 7-8.' : profile.level==='avanzado' ? 'Como avanzado: ultima serie de aislamientos al fallo. Nunca en compounds pesados.' : 'Como intermedio: ultima serie a RPE 9. El resto a RPE 7-8.'}\n\n**Ciencia:** Entrenar a 1-3 RIR produce ~90% del estimulo del fallo con MUCHA menos fatiga.`;
        }
        return `**Principios de Entrenamiento**\n\n**Los 4 pilares de hipertrofia:**\n1. Tension mecanica: 60-85% 1RM\n2. Volumen: suficientes series/semana\n3. Progresion: hacer MAS cada sesion\n4. Recovery: descanso y nutricion\n\n**Para tu nivel (${profile.level||'intermedio'}):**\n• Series/ejercicio: ${profile.level==='principiante'?'3':'3-4'}\n• Reps hipertrofia: 6-12 compound, 10-20 aislamiento\n• RPE: ${periodWeek.rpe}\n• Frecuencia/musculo: 2x/semana\n• Descanso: 2-3min compound, 60-90s aislamiento\n• Progresion: +2.5kg o +1 rep/semana`;
    },

    genMotivation(profile) {
        const workouts = Storage.getWorkoutHistory().length;
        const responses = [
            `**La disciplina supera a la motivacion.**\n\nLa motivacion es un sentimiento temporal. La disciplina es una decision.\n\nLos atletas de elite no quieren entrenar todos los dias. La diferencia es que van igual.\n\n**La regla de los 5 minutos:** Comprometete solo a ir y calentar 5 min. Si despues quieres irte, te vas. (Nadie se ha ido despues de calentar.)\n\nTienes ${workouts} entrenamientos completados. Cada uno es prueba de que puedes.\n\nTu yo de dentro de 3 meses te agradecera cada sesion de hoy. Ahora ponte los tenis y haz la primera serie.`,
            `**Perspectiva:**\n\n• 12 semanas = 84 dias\n• 1 hora de gym = 4% de tu dia\n• 4x/semana = menos de 5 horas de 168\n\nTienes el tiempo. Lo que falta no es motivacion, es DECISION.\n\nDentro de 90 dias VAS a existir. La pregunta es: vas a ser la misma version? O la que entrena, come bien y se transforma?\n\nEl dolor de la disciplina pesa gramos. El del arrepentimiento pesa toneladas.\n\nNadie se arrepiente despues de entrenar. NUNCA.`,
            `**${workouts} entrenamientos completados.**\n\nEl 92% de la gente abandona antes de la semana 8. Tu sigues aqui.\n\nNo pienses "tengo que entrenar". Piensa "ELIJO entrenar".\n\nHoy no necesitas una sesion perfecta. Solo necesitas presentarte. La consistencia siempre gana al esfuerzo esporadico.\n\nVe al gym. Aunque sean 30 minutos. Porque el habito importa mas que la intensidad.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    genSomatotype(profile) {
        const soma = typeof FitnessTools !== 'undefined' ? FitnessTools.getSomatotype(profile) : null;
        if (!soma) return 'Completa tu perfil (peso, altura, medidas) para determinar tu somatotipo.';
        let r = `**Tu Somatotipo: ${soma.type}**\n\n${soma.description}\n\n`;
        r += `**Entrenamiento ideal:**\n${soma.training.map(t => '• ' + t).join('\n')}\n\n`;
        r += `**Nutricion ideal:**\n${soma.nutrition.map(n => '• ' + n).join('\n')}\n\n`;
        r += `Nadie es 100% un solo tipo. Tu tipo dominante define la estrategia optima.`;
        return r;
    },

    genOneRM(input, profile) {
        const w = profile.weight || 70;
        // Check if user gave weight x reps
        const match = input.match(/(\d+)\s*(?:kg)?\s*(?:x|por|×)\s*(\d+)/);
        if (match) {
            const liftW = parseInt(match[1]);
            const reps = parseInt(match[2]);
            const oneRM = Math.round(liftW * (36 / (37 - reps))); // Brzycki
            return `**Calculo de 1RM**\n\n${liftW}kg x ${reps} reps = **~${oneRM}kg de 1RM**\n\n**Tabla de porcentajes:**\n• 90% = ${Math.round(oneRM*0.9)}kg (3 reps - fuerza)\n• 80% = ${Math.round(oneRM*0.8)}kg (8 reps - hipertrofia)\n• 70% = ${Math.round(oneRM*0.7)}kg (12 reps - resistencia)\n• 60% = ${Math.round(oneRM*0.6)}kg (15+ reps - calentamiento)`;
        }
        return `**Calculadora de 1RM**\n\nDime peso y repeticiones para calcular tu maximo.\nEjemplo: "80kg x 8 reps"\n\n**Formula rapida (Brzycki):**\n1RM = Peso x (36 / (37 - reps))\n\nEjemplo: 80kg x 8 = ~101kg de 1RM`;
    },

    genCreateRoutine(profile, periodWeek) {
        const routine = this.generateCustomRoutine(profile);
        Storage.saveRoutine(routine);
        return `**Rutina creada y guardada**\n\n"${routine.name}" basada en:\n• Nivel: ${profile.level||'intermedio'}\n• Dias: ${profile.daysPerWeek||4}/semana\n• Objetivo: ${profile.goal||'ganar musculo'}\n• Fase: ${periodWeek.phase}\n\n**Incluye ${routine.days.length} dias:**\n${routine.days.map((d,i) => '• Dia '+(i+1)+': '+d.name).join('\n')}\n\nVe a la seccion Entreno para verla y empezar.`;
    },


    genGreeting(profile, periodWeek) {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Buenos dias' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
        const week = Storage.getCurrentWeek();
        const todayWorkout = Storage.getWorkoutHistory().find(w => new Date(w.date).toDateString() === new Date().toDateString());

        let r = `${greeting}, ${profile.name || 'crack'}.\n\n`;
        r += `Semana ${week}/12 | Fase: ${periodWeek.phase} | RPE ${periodWeek.rpe}`;
        if (periodWeek.deload) r += ' (deload)';
        r += '\n';
        r += todayWorkout ? 'Ya entrenaste hoy.' : 'Aun no entrenas hoy.';
        r += `\n\nPuedo ayudarte con entrenamiento, nutricion, suplementacion, lesiones, recuperacion, o cualquier duda de fitness. Pregunta lo que necesites.`;
        return r;
    },

    genThanks(profile) {
        const responses = [
            `De nada. Si te surge otra duda, aqui estoy. Ahora a darle.`,
            `Para eso estoy. Consistencia > perfeccion. Sigue asi.`,
            `Me alegra ayudar. Tu pon el esfuerzo, yo la guia. Cualquier cosa, pregunta.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    genWeightManagement(input, profile) {
        const m = this.getUserMetrics(profile);
        let r = `**Sobre tu peso (${m.w}kg)**\n\n`;
        r += `**Importante:**\n• El peso fluctua 1-3kg/dia (agua, comida, sodio)\n• Pesate 3x/semana en ayunas, saca promedio semanal\n• Solo el promedio semanal importa\n\n`;
        if (input.includes('subir') || input.includes('ganar') || input.includes('engordar')) {
            r += `**Para subir de peso (musculo):**\n• Come ${Math.round(m.tdee+300)} kcal/dia (+300 sobre TDEE)\n• Proteina: ${Math.round(m.w*2)}g/dia\n• Objetivo: +0.25-0.5kg/semana\n• Si subes mas rapido = mucha grasa\n• Entrena pesado, progresa en pesos`;
        } else {
            r += `**Para bajar de peso (grasa):**\n• Come ${Math.round(m.tdee-400)} kcal/dia (-400 bajo TDEE)\n• Proteina: ${Math.round(m.w*2.2)}g/dia (preservar musculo)\n• Objetivo: -0.5 a 1kg/semana\n• Si bajas mas rapido = perderas musculo\n• NO dejes de entrenar pesado`;
        }
        r += `\n\n**Despues de dia libre:** +1-3kg es AGUA (se va en 2-3 dias). No entres en panico.`;
        return r;
    },

    genFlexibility(input, profile) {
        return `**Movilidad y Flexibilidad**\n\nLa movilidad mejora rendimiento y previene lesiones.\n\n**Rutina diaria (10 min):**\n• Cat-cow: 10 reps\n• World's greatest stretch: 5/lado\n• Hip 90/90: 30s/lado\n• Shoulder dislocations con palo: 10 reps\n• Deep squat hold: 30-60s\n• Pigeon stretch: 30s/lado\n\n**Cuando hacerla:**\n• Pre-entreno: movilidad DINAMICA (no estirar estatico)\n• Post-entreno o noche: estiramientos ESTATICOS (30-60s)\n\n**Para sentadilla profunda:** trabaja movilidad de tobillo (rodilla sobre punta del pie en pared) y cadera (90/90, pigeon).\n\nLa flexibilidad mejora en semanas si eres consistente. 5-10 min/dia es suficiente.`;
    },

    genBeginnerGuide(profile) {
        const w = profile.weight || 70;
        return `**Guia para Empezar**\n\nLos principiantes tienen la mejor ventaja: "noob gains". Tu cuerpo cambiara mas rapido que nunca.\n\n**Plan primeras 4 semanas:**\n\n1. **Frecuencia:** 3 dias/semana (L-M-V)\n2. **Rutina:** Full Body\n3. **Ejercicios basicos:**\n   • Sentadilla (piernas)\n   • Press banca (pecho)\n   • Remo barra (espalda)\n   • Press militar (hombros)\n   • Curl biceps + Pushdown triceps\n\n4. **Nutricion simple:**\n   • ${Math.round(w*30)} kcal/dia\n   • ${Math.round(w*1.8)}g proteina/dia\n   • Verduras en cada comida\n\n5. **Reglas:**\n   • Tecnica > Peso (siempre)\n   • Progresa +2.5kg/semana en basicos\n   • Nunca faltes 2 dias seguidos\n   • Duerme 7-9 horas\n\nDime "creame una rutina" y te genero una perfecta para empezar.`;
    },

    genAlcohol(profile) {
        return `**Alcohol y Fitness**\n\nRealidad:\n• Reduce sintesis proteica 20-30%\n• Baja testosterona 24-72h\n• Son calorias vacias (7kcal/g)\n• Empeora calidad de sueno\n\n**Reglas si vas a tomar:**\n1. Maximo 1-2 tragos, 1-2 veces/semana\n2. Nunca el dia de entreno ni antes de piernas\n3. Come proteina antes y despues\n4. 1 vaso agua por cada trago\n\n**Menos malas opciones:** vodka + soda, vino tinto, cerveza light\n**Peores:** cocteles dulces (300-500kcal cada uno)\n\nSi estas en un cut serio: 0 alcohol por 8-12 semanas acelera mucho los resultados.`;
    },

    genSleep(profile) {
        return `**Optimizar el Sueno**\n\nEl sueno es donde tu cuerpo crece. Con <6h pierdes 60% de capacidad de sintesis proteica.\n\n**Protocolo:**\n• Duracion: 7-9h (sin negociar)\n• Consistencia: misma hora ±30min todos los dias\n• Ambiente: oscuro total, 18-20C, silencio\n• Pre-sueno: sin pantallas 45min antes\n• No cafeina despues de las 14:00\n\n**Suplementos para sueno:**\n• Magnesio glicinato: 400mg (relajacion)\n• Ashwagandha: 600mg (reduce cortisol)\n• Glicina: 3g (calidad de sueno)\n• Melatonina: 0.5-1mg solo si viajas o cambias horario\n\n**Tips:**\n• Rutina nocturna: ducha caliente, leer, respiracion\n• Exposicion a luz solar por la manana (regula ritmo circadiano)\n• Ejercicio mejora sueno pero no entrenar <2h antes de dormir`;
    },

    genStress(profile) {
        return `**Fitness y Salud Mental**\n\nEl ejercicio es uno de los mejores antidepresivos naturales. La ciencia es clara:\n\n**Beneficios comprobados:**\n• Libera endorfinas\n• Reduce cortisol 30-40%\n• Mejora calidad de sueno\n• Aumenta autoestima y confianza\n• Da estructura y proposito\n\n**Recomendaciones:**\n1. Entrena aunque no tengas ganas (la regla de 5 min)\n2. Prioriza pesas sobre cardio (mas impacto en autoestima)\n3. Duerme 7-9h (sin sueno todo empeora)\n4. Camina 20-30min al aire libre (luz solar = serotonina)\n5. Come bien (nutricion afecta mucho el animo)\n\nEl gym transforma tu cuerpo Y tu mente.\n\n*Si necesitas ayuda profesional, no dudes en buscar un psicologo. El gym complementa, no reemplaza la terapia.*`;
    },

    genHydration(profile) {
        const w = profile.weight || 70;
        return `**Hidratacion (${w}kg)**\n\n• Minimo diario: ${Math.round(w*0.035)}L (${Math.round(w*35)}ml)\n• Dias de entreno: +500ml-1L extra\n• Si sudas mucho: +1L adicional\n\n**Senales de deshidratacion:**\n• Orina amarilla oscura\n• Fatiga durante entreno\n• Dolor de cabeza\n• Calambres\n\n**Tips:**\n• 500ml al despertar\n• Botella en el gym siempre\n• Bebe antes de sentir sed\n• Electrolitos si entrenas >90min\n\nUn 2% de deshidratacion = -10% de fuerza. Bebe agua.`;
    },


    genMyths(input) {
        const myths = [
            { q: 'sudar', a: 'Sudar NO significa quemar grasa. El sudor es termorregulacion.' },
            { q: 'mujer', a: 'Las mujeres NO se ponen enormes con pesas. No tienen suficiente testosterona.' },
            { q: 'comer noche', a: 'Comer de noche NO engorda. Lo que importa es el total calorico del dia.' },
            { q: 'cada 3 hora', a: 'NO necesitas comer cada 3 horas. El total diario de proteina importa mas que la frecuencia.' },
            { q: 'cardio musculo', a: 'El cardio moderado NO quema musculo. Solo el excesivo sin proteina adecuada.' },
            { q: 'abs cocina', a: 'VERDAD. Los abdominales se revelan con bajo % grasa (dieta), se construyen con entreno.' },
            { q: 'creatina', a: 'La creatina NO es peligrosa. Es el suplemento mas estudiado y seguro de la historia.' },
            { q: 'fallo', a: 'NO necesitas ir al fallo cada serie. 1-3 RIR produce ~90% del estimulo con menos fatiga.' },
            { q: 'ventana anabolica', a: 'La "ventana anabolica" de 30min es un MITO. Tienes 4-6 horas post-entreno para comer.' },
            { q: 'tonificar', a: '"Tonificar" no existe como concepto. Es ganar musculo + perder grasa. No hay entreno especial para eso.' },
            { q: 'grasa localizada', a: 'NO puedes quemar grasa localizada. El cuerpo pierde grasa de forma general, no donde quieres.' },
            { q: 'pesa', a: 'Las pesas NO te hacen lento ni rigido. Los atletas mas explosivos entrenan con pesas.' }
        ];

        // Find matching myth
        const match = myths.find(m => input.includes(m.q));
        if (match) {
            return `**Respuesta basada en evidencia:**\n\n${match.a}\n\nLa ciencia del fitness es clara en este punto. Si tienes otra duda, pregunta.`;
        }

        let r = `**Mitos Comunes del Fitness (la verdad):**\n\n`;
        myths.slice(0, 8).forEach(m => { r += `• ${m.a}\n\n`; });
        r += `Preguntame sobre cualquier mito especifico y te digo que dice la ciencia.`;
        return r;
    },

    genHormones(input, profile) {
        if (input.includes('testosterona')) {
            return `**Testosterona Natural**\n\n**Como optimizarla (sin sustancias):**\n1. Duerme 7-9h (la T se produce durante el sueno profundo)\n2. Entrena pesado (compound lifts: squat, deadlift, bench)\n3. Come suficiente grasa (0.8-1g/kg, especialmente monoinsaturada)\n4. Mantiene bajo tu % grasa (15-20% es optimo)\n5. Reduce estres cronico (cortisol mata testosterona)\n6. Vitamina D: 2000-4000 IU/dia\n7. Zinc: 15-30mg/dia\n8. Evita alcohol excesivo\n\n**Lo que NO funciona:** boosters de testosterona de suplementos (tribulus, etc). No tienen efecto significativo.\n\n*Si sospechas hipogonadismo, hazte analitica de sangre con tu medico.*`;
        }
        return `**Hormonas y Fitness**\n\n**Hormonas clave:**\n• **Testosterona:** musculo, fuerza, libido. Optimizar con sueno + pesas + grasa dietaria\n• **Cortisol:** estres, catabolismo. Reducir con sueno + descanso + no sobreentrenar\n• **Insulina:** nutrientes a las celulas. Manejar con timing de carbos post-entreno\n• **Hormona de crecimiento:** recuperacion, quema de grasa. Picos durante sueno profundo\n\n**Para optimizar todo:** Duerme bien, entrena pesado, come suficiente, maneja el estres.\n\nPreguntame sobre alguna hormona especifica si quieres mas detalle.`;
    },

    genAging(input, profile) {
        return `**Entrenamiento Segun Edad**\n\n**Despues de los 40:**\n• Calentamiento mas largo (10-15min)\n• Prioriza movilidad articular\n• Pesas siguen siendo ESENCIALES (previenen sarcopenia)\n• Baja la intensidad maxima (RPE 7-8 vs 9-10)\n• Mas volumen moderado, menos peso extremo\n• Recuperacion mas lenta: descansa mas entre sesiones\n• Proteina mas alta: 2.2-2.4g/kg\n\n**Despues de los 50:**\n• Incluye trabajo de equilibrio\n• Ejercicios unilaterales para prevenir asimetrias\n• Cardio para salud cardiovascular (150min/semana)\n• Suplementa: Vitamina D, Omega-3, Creatina (todos con evidencia)\n\n**La verdad:** puedes construir musculo a CUALQUIER edad. Es mas lento pero posible. Y los beneficios para salud son aun mas importantes.\n\nNunca es tarde para empezar.`;
    },

    genWomensFitness(input, profile) {
        const w = profile.weight || 60;
        if (input.includes('embarazo')) {
            return `**Ejercicio en Embarazo**\n\n*Consulta SIEMPRE con tu ginecologo antes.*\n\n**General (si no hay contraindicaciones):**\n• El ejercicio moderado es BENEFICIOSO durante el embarazo\n• Evita: contacto, caidas, acostada boca arriba (2do-3er trimestre)\n• Si: caminar, nadar, pesas moderadas, yoga prenatal\n• Escucha tu cuerpo: si algo no se siente bien, para\n• Hidratacion extra, no sobrecalentarse\n• Intensidad: poder hablar durante el ejercicio`;
        }
        return `**Fitness Femenino**\n\n**Verdades:**\n• Las pesas NO te haran enorme (no tienes testosterona suficiente)\n• Las pesas SI te daran forma, definicion y "tono"\n• El mejor entreno para mujeres es IGUAL que para hombres: compound + progresion\n\n**Consideraciones del ciclo:**\n• Fase folicular (dia 1-14): mas energia y fuerza. Entrena pesado.\n• Fase lutea (dia 15-28): puede haber mas fatiga. Ajusta si necesitas.\n• No es excusa para no entrenar, pero ajusta intensidad segun como te sientas\n\n**Nutricion:**\n• Calorias: ${Math.round(w*28)} kcal/dia aprox (ajustar segun objetivo)\n• Proteina: ${Math.round(w*2)}g/dia\n• Hierro: importante, especialmente si menstruas mucho\n\n**Prioridades esteticas comunes:**\n• Gluteos: hip thrust, bulgara, RDL\n• Core: planks, pallof press, dead bugs\n• Hombros: laterales para forma`;
    },

    genHomeWorkout(input, profile) {
        return `**Entrenamiento en Casa (sin equipo)**\n\n**Rutina Full Body (3x/semana):**\n\n**1. Push-ups** (o en rodillas)\n4 series x max reps | Pecho, hombros, triceps\n\n**2. Sentadilla bulgara** (pie en silla)\n3 series x 12/pierna | Cuadriceps, gluteos\n\n**3. Remo invertido** (debajo de mesa)\n4 series x 10-15 | Espalda\n\n**4. Hip thrust** (espalda en sofa)\n3 series x 15-20 | Gluteos\n\n**5. Pike push-ups** (pies elevados)\n3 series x 8-12 | Hombros\n\n**6. Plancha**\n3 series x 30-60s | Core\n\n**Progresion sin peso:**\n• Mas reps\n• Mas series\n• Tempo mas lento (3s bajada)\n• Variaciones mas dificiles\n• Mochila con libros para carga\n\n**Limitacion:** sin equipo es dificil progresar en espalda y piernas mas alla de cierto punto. Invierte en bandas de resistencia o mancuernas ajustables si puedes.`;
    },

    genFrequency(input, profile) {
        return `**Frecuencia y Timing**\n\n**Mejor hora para entrenar:**\n• Manana (6-10): testosterona mas alta, menos gente\n• Tarde (15-19): pico de fuerza, reflejos mejores\n• Noche (20-22): puede afectar sueno\n• **La mejor hora = la que puedas ser CONSISTENTE**\n\n**Cuantos dias:**\n• 3 dias: Full Body (frecuencia 3x/musculo)\n• 4 dias: Upper/Lower (frecuencia 2x/musculo)\n• 5 dias: PPL o Bro Split (alto volumen)\n• 6 dias: PPL x2 (volumen + frecuencia maxima)\n\n**Duracion por sesion:** 45-75 min (mas no es mejor)\n\n**Descanso entre sesiones:** minimo 48h para el mismo musculo\n\n**Para ver resultados:** minimo 4-6 semanas de consistencia\n\n**Regla:** La consistencia importa mas que el programa perfecto. El mejor programa es el que SIGUES.`;
    },


    // ===== SMART DEFAULT RESPONSE =====
    genSmartDefault(prompt, input, profile, periodWeek) {
        const w = profile.weight || 70;
        const week = Storage.getCurrentWeek();

        // Try to give a helpful response based on keywords present
        if (input.includes('cuanto') || input.includes('cuanta') || input.includes('cuantos')) {
            // Quantitative questions
            if (input.includes('proteina')) return `Necesitas **${Math.round(w*2)}g de proteina/dia** (2g/kg). Distribuida en 4-5 comidas. Fuentes: pollo, pescado, huevos, whey, yogur griego.`;
            if (input.includes('agua')) return this.genHydration(profile);
            if (input.includes('caloria')) return `Tu TDEE estimado: **${this.getUserMetrics(profile).tdee} kcal**. ${profile.goal&&profile.goal.includes('perder')?'Para perder grasa: '+Math.round(this.getUserMetrics(profile).tdee-400)+' kcal':'Para ganar musculo: '+Math.round(this.getUserMetrics(profile).tdee+300)+' kcal'}.`;
            if (input.includes('peso') || input.includes('levantar')) return `Usa un peso que te permita completar las reps con buena tecnica a RPE ${periodWeek.rpe} (${10-periodWeek.rpe} reps en reserva).`;
        }

        if (input.includes('que es') || input.includes('que son') || input.includes('que significa')) {
            // Definitional questions
            if (input.includes('rpe')) return `**RPE (Rating of Perceived Exertion):** escala de esfuerzo del 1-10. RPE 10 = fallo muscular. RPE 8 = te quedan 2 reps. Tu RPE actual: ${periodWeek.rpe}.`;
            if (input.includes('rir')) return `**RIR (Reps In Reserve):** repeticiones que te quedan en el tanque. RIR 2 = podrias hacer 2 reps mas. Es lo opuesto al RPE. RIR 2 = RPE 8.`;
            if (input.includes('deload')) return `**Deload:** semana de descarga. Reduces peso al 50-60% y volumen a la mitad. Permite que tu cuerpo se recupere de la fatiga acumulada. Se hace cada 4-6 semanas.`;
            if (input.includes('hipertrofia')) return `**Hipertrofia:** crecimiento muscular. Se logra con: tension mecanica (peso suficiente), volumen adecuado (10-20 series/semana), progresion (hacer mas cada vez) y recovery (sueno + comida).`;
            if (input.includes('tdee')) return `**TDEE (Total Daily Energy Expenditure):** calorias totales que quemas al dia incluyendo ejercicio. El tuyo: ~${this.getUserMetrics(profile).tdee} kcal. Come por encima para ganar, por debajo para perder.`;
            if (input.includes('compound') || input.includes('compuesto')) return `**Ejercicio compuesto:** mueve multiples articulaciones y musculos (sentadilla, press banca, peso muerto). Son la BASE de cualquier programa. Mas eficientes y permiten mas carga.`;
            if (input.includes('superavit')) return `**Superavit calorico:** comer MAS de lo que gastas. Necesario para ganar musculo. Recomendado: +200-350 kcal sobre TDEE. Para ti: ~${Math.round(this.getUserMetrics(profile).tdee+300)} kcal/dia.`;
            if (input.includes('deficit')) return `**Deficit calorico:** comer MENOS de lo que gastas. Necesario para perder grasa. Recomendado: -300-500 kcal bajo TDEE. Para ti: ~${Math.round(this.getUserMetrics(profile).tdee-400)} kcal/dia.`;
        }

        if (input.includes('puedo') || input.includes('debo') || input.includes('es bueno') || input.includes('esta bien')) {
            // Permission/advice questions
            if (input.includes('entrenar todos')) return `Entrenar todos los dias NO es necesario ni optimo. Los musculos crecen durante el DESCANSO. ${profile.daysPerWeek||4} dias de pesas + descanso activo (caminar) el resto es ideal.`;
            if (input.includes('saltarme') || input.includes('saltar')) return `Un dia saltado no arruina nada. Lo que arruina es la tendencia. Si faltas hoy, asegurate de ir manana. Nunca 2 faltas seguidas.`;
            if (input.includes('enfermo') || input.includes('gripado') || input.includes('resfri')) return `**Si estas enfermo:**\n• Sintomas cuello arriba (nariz, garganta): puedes entrenar suave\n• Sintomas cuello abajo (pecho, fiebre, cuerpo): DESCANSA\n• Cuando vuelvas: 2-3 sesiones al 70% antes de retomar normal`;
        }

        // Catch-all intelligent response
        let r = `**Sobre tu pregunta:**\n\n"${prompt}"\n\n`;
        r += `Puedo ayudarte con:\n• Rutinas y ejercicios personalizados\n• Nutricion, macros y planes de comida\n• Suplementacion basada en evidencia\n• Lesiones, dolor y recuperacion\n• Progresion, estancamientos, ciencia del entrenamiento\n• Objetivos con timeline realista\n• Motivacion y habitos\n\n`;
        r += `Prueba preguntar algo como:\n• "Que entreno hoy?"\n• "Cuanta proteina necesito?"\n• "Como eliminar grasa abdominal?"\n• "Es mejor cardio o pesas?"\n• "Creame una rutina nueva"`;
        return r;
    },

    // ===== LOCAL IMAGE ANALYSIS =====
    localImageAnalysis() {
        const profile = Storage.getProfile();
        const m = this.getUserMetrics(profile);
        const week = Storage.getCurrentWeek();
        let estimatedBF = m.g === 'mujer' ? (1.20*parseFloat(m.bmi))+(0.23*m.a)-5.4 : (1.20*parseFloat(m.bmi))+(0.23*m.a)-16.2;
        estimatedBF = Math.max(5, Math.min(45, estimatedBF)).toFixed(0);

        let r = `**Valoracion Basada en tu Perfil**\n\n`;
        r += `${m.w}kg | ${m.h}cm | IMC: ${m.bmi} | Grasa estimada: ~${estimatedBF}%\n\n---\n\n`;
        
        if (estimatedBF < 15) {
            r += `**Estado:** Atletico/definido. Los musculos se ven con buena separacion.\n\n**Recomendacion:** Lean bulk controlado (+250kcal). Enfocate en musculos rezagados para simetria.\n`;
        } else if (estimatedBF < 20) {
            r += `**Estado:** Buena base muscular con capa de grasa moderada.\n\n**Recomendacion:** Deficit de -400kcal con proteina alta (${Math.round(m.w*2.2)}g). En 8-12 semanas revelaras el musculo que ya tienes.\n`;
        } else {
            r += `**Estado:** La grasa esta tapando el musculo. La solucion es nutricional.\n\n**Recomendacion:** Deficit de -500kcal: ${Math.round(m.w*24)} kcal/dia. Proteina: ${Math.round(m.w*2.2)}g. Entrena pesado para preservar musculo. Cardio: 10.000 pasos/dia.\n`;
        }

        r += `\n**Timeline:**\n• Semana 3-4: ropa queda diferente\n• Semana 5-8: tu notas el cambio\n• Semana 9-12: los demas notan el cambio\n\n`;
        r += `Toma fotos cada 2 semanas con la misma luz y pose para comparar progreso real.`;
        return r;
    },

    // ===== ROUTINE GENERATOR =====
    generateCustomRoutine(profile) {
        const days = profile.daysPerWeek || 4;
        let templateKey = days <= 3 ? 'fullBody' : days === 4 ? 'upperLower' : days === 5 ? 'bro' : 'ppl';
        const template = ROUTINE_TEMPLATES[templateKey];
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        return {
            id: 'ai-generated-' + Date.now(),
            name: template.name + ' (IA)',
            description: `Generada por IA - Semana ${week} - ${periodWeek.phase}`,
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
