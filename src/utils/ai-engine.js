// ===== AI ENGINE - Motor de Inteligencia Artificial =====
const AIEngine = {
    // API Key para OpenAI (configurable)
    getApiKey() {
        return Storage.getSettings().apiKey || '';
    },

    // Genera respuesta usando OpenAI API si hay key, sino usa motor local
    async generateResponse(prompt, context = {}) {
        const apiKey = this.getApiKey();
        if (apiKey) {
            return await this.callOpenAI(prompt, context);
        }
        return this.localAI(prompt, context);
    },

    // Llamada a OpenAI
    async callOpenAI(prompt, context) {
        const apiKey = this.getApiKey();
        const profile = Storage.getProfile();
        const systemPrompt = this.buildSystemPrompt(profile, context);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 1500,
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
        if (!apiKey) {
            return this.localImageAnalysis(question);
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{
                        role: 'user',
                        content: [
                            { type: 'text', text: question || 'Analiza esta foto de mi físico. Dame una valoración honesta de mi composición corporal, puntos fuertes, áreas de mejora y estimación de % de grasa corporal. Sé directo y constructivo.' },
                            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                        ]
                    }],
                    max_tokens: 1000
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            }
            return this.localImageAnalysis(question);
        } catch (error) {
            return this.localImageAnalysis(question);
        }
    },

    buildSystemPrompt(profile, context) {
        return `Eres FitAI, un entrenador personal y nutricionista experto con IA. Datos del usuario:
- Nombre: ${profile.name || 'Usuario'}
- Edad: ${profile.age || 'No especificada'}
- Peso: ${profile.weight || '?'}kg, Altura: ${profile.height || '?'}cm
- Objetivo: ${profile.goal || 'mejorar físico'}
- Nivel: ${profile.level || 'intermedio'}
- Días disponibles: ${profile.daysPerWeek || 4}/semana
- Semana actual del programa: ${Storage.getCurrentWeek()}/12

Responde en español, sé directo, motivador y da información práctica y basada en evidencia.
Usa periodización ondulante, progresión de cargas y principios de hipertrofia modernos.
Si preguntan por nutrición, calcula basándote en su peso y objetivo.
Formato: usa emojis moderadamente para hacer la respuesta visual.`;
    },


    // Motor de IA local (sin API key)
    localAI(prompt, context) {
        const lowerPrompt = prompt.toLowerCase();
        const profile = Storage.getProfile();
        const week = Storage.getCurrentWeek();
        const periodWeek = PERIODIZATION.weeks[week - 1] || PERIODIZATION.weeks[0];

        // Rutina personalizada
        if (lowerPrompt.includes('rutina') || lowerPrompt.includes('programa') || lowerPrompt.includes('plan de entrenamiento')) {
            return this.generateRoutineAdvice(profile, periodWeek);
        }

        // Nutrición
        if (lowerPrompt.includes('nutri') || lowerPrompt.includes('dieta') || lowerPrompt.includes('comer') || lowerPrompt.includes('comida') || lowerPrompt.includes('macro') || lowerPrompt.includes('calor')) {
            return this.generateNutritionAdvice(profile);
        }

        // Valoración
        if (lowerPrompt.includes('valorar') || lowerPrompt.includes('valoraci') || lowerPrompt.includes('evalua') || lowerPrompt.includes('estado')) {
            return this.generateAssessment(profile);
        }

        // Progreso
        if (lowerPrompt.includes('progreso') || lowerPrompt.includes('avance') || lowerPrompt.includes('resultado')) {
            return this.generateProgressReport(profile);
        }

        // Suplementos
        if (lowerPrompt.includes('suplement') || lowerPrompt.includes('creatina') || lowerPrompt.includes('proteína') || lowerPrompt.includes('proteina')) {
            return this.generateSupplementAdvice(profile);
        }

        // Motivación
        if (lowerPrompt.includes('motiv') || lowerPrompt.includes('ánimo') || lowerPrompt.includes('no quiero') || lowerPrompt.includes('cansad')) {
            return this.generateMotivation(profile);
        }

        // Descanso / Recovery
        if (lowerPrompt.includes('descanso') || lowerPrompt.includes('dormir') || lowerPrompt.includes('sueño') || lowerPrompt.includes('recuper')) {
            return this.generateRecoveryAdvice(profile);
        }

        // Respuesta general
        return this.generateGeneralAdvice(profile, periodWeek);
    },

    generateRoutineAdvice(profile, periodWeek) {
        const days = profile.daysPerWeek || 4;
        let recommendation = '';

        if (days <= 3) recommendation = 'fullBody';
        else if (days === 4) recommendation = 'upperLower';
        else if (days >= 5) recommendation = 'ppl';

        const routine = ROUTINE_TEMPLATES[recommendation];
        const week = Storage.getCurrentWeek();

        return `💪 **Tu Plan de Entrenamiento Personalizado**

📅 **Semana ${week}/12 - Fase: ${periodWeek.phase}**
⚡ Intensidad: ${periodWeek.intensity}% | RPE: ${periodWeek.rpe}
${periodWeek.deload ? '🟢 SEMANA DE DELOAD - Reduce peso al 60% y disfruta la recuperación' : ''}

📋 **Rutina recomendada: ${routine.name}**
${routine.description}
⏱️ Duración: ${routine.duration} | 📆 ${routine.frequency} días/semana

**Distribución semanal:**
${routine.days.map((d, i) => `  Día ${i + 1}: ${d.name} (${d.exercises.length} ejercicios)`).join('\n')}

**🔑 Claves para esta semana:**
${periodWeek.deload ? 
'• Reduce peso al 55-60% de tu máximo\n• Haz la mitad de las series\n• Enfócate en técnica y movilidad\n• Tu cuerpo se recupera para crecer más' :
'• Progresión: intenta añadir 2.5kg en compuestos\n• Lleva cada serie a RPE ' + periodWeek.rpe + '\n• Descanso: 2-3min compuestos, 60-90s aislamiento\n• Si no progresas, mantén el peso y añade 1 rep'}

**📊 Progresión de cargas:**
${PERIODIZATION.guidelines.progression}

¿Quieres que te detalle los ejercicios de algún día específico o que ajuste algo?`;
    },

    generateNutritionAdvice(profile) {
        const weight = profile.weight || 70;
        const goal = profile.goal || 'ganar músculo';
        let calories, protein, carbs, fats;

        if (goal.includes('perder') || goal.includes('definir') || goal.includes('bajar')) {
            calories = Math.round(weight * 26);
            protein = Math.round(weight * 2.2);
            fats = Math.round(weight * 0.9);
            carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
        } else if (goal.includes('ganar') || goal.includes('volumen') || goal.includes('músculo')) {
            calories = Math.round(weight * 35);
            protein = Math.round(weight * 2);
            fats = Math.round(weight * 1);
            carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
        } else {
            calories = Math.round(weight * 30);
            protein = Math.round(weight * 1.8);
            fats = Math.round(weight * 1);
            carbs = Math.round((calories - (protein * 4) - (fats * 9)) / 4);
        }

        return `🥗 **Tu Plan Nutricional Personalizado**

🎯 Objetivo: ${goal}
⚖️ Peso actual: ${weight}kg

📊 **Macros diarios:**
• 🔥 Calorías: **${calories} kcal**
• 🥩 Proteína: **${protein}g** (${Math.round(protein*4/calories*100)}%)
• 🍚 Carbohidratos: **${carbs}g** (${Math.round(carbs*4/calories*100)}%)
• 🥑 Grasas: **${fats}g** (${Math.round(fats*9/calories*100)}%)

🍽️ **Distribución sugerida (5 comidas):**

**Desayuno (7:00):** ~${Math.round(calories*0.25)} kcal
• Avena con frutas + claras de huevo + tostada integral

**Media mañana (10:00):** ~${Math.round(calories*0.15)} kcal  
• Yogur griego + frutos secos + fruta

**Almuerzo (13:00):** ~${Math.round(calories*0.30)} kcal
• Proteína (pollo/pescado/carne) + arroz/pasta + verduras

**Merienda/Pre-entreno (16:00):** ~${Math.round(calories*0.15)} kcal
• Batido de proteína + plátano + avena

**Cena (20:00):** ~${Math.round(calories*0.15)} kcal
• Proteína + ensalada grande + carbohidrato complejo

💡 **Tips clave:**
• Prioriza 30-40g de proteína por comida
• Carbohidratos complejos antes/después de entrenar
• Hidrátate: mínimo ${Math.round(weight * 0.035)}L de agua/día
• Verduras en cada comida principal
• Permite un 10-15% de comidas flexibles (no es dieta, es estilo de vida)

¿Quieres ideas de comidas específicas o ajustar los macros?`;
    },

    generateAssessment(profile) {
        const weight = profile.weight || 70;
        const height = profile.height || 170;
        const bmi = (weight / ((height/100) ** 2)).toFixed(1);
        const week = Storage.getCurrentWeek();
        const workouts = Storage.getWorkoutHistory().length;

        let bmiCategory = '';
        if (bmi < 18.5) bmiCategory = 'Bajo peso - enfócate en ganar masa muscular';
        else if (bmi < 25) bmiCategory = 'Normal - excelente base para trabajar';
        else if (bmi < 30) bmiCategory = 'Sobrepeso - recomposición corporal ideal';
        else bmiCategory = 'Obesidad - prioriza déficit calórico moderado';

        return `📊 **Valoración Física Completa**

👤 **Datos básicos:**
• Peso: ${weight}kg | Altura: ${height}cm
• IMC: ${bmi} (${bmiCategory})
• Nivel: ${profile.level || 'intermedio'}
• Semana del programa: ${week}/12

📈 **Estado actual:**
• Entrenamientos completados: ${workouts}
• Consistencia: ${workouts > 0 ? Math.round(workouts / (week * (profile.daysPerWeek || 4)) * 100) : 0}%

🎯 **Recomendaciones basadas en tu perfil:**

${profile.level === 'principiante' ? 
`Como principiante, tienes la MEJOR ventaja: "newbie gains"
• Puedes ganar 0.5-1kg de músculo/mes fácilmente
• Enfócate en aprender técnica perfecta
• Progresión lineal: +2.5kg cada semana en los básicos
• En 3-4 meses vas a ver un cambio BRUTAL` :
profile.level === 'intermedio' ?
`Como intermedio, la clave es la PROGRESIÓN INTELIGENTE:
• Periodización ondulante (ya la tienes programada)
• Entrena a RPE 7-9 según la fase
• Variación de estímulos cada 4-6 semanas
• Espera 0.25-0.5kg de músculo/mes` :
`Como avanzado, optimiza CADA detalle:
• Periodización por bloques
• Técnicas de intensidad en series finales
• Prioriza puntos débiles
• Recovery es tan importante como el entreno`}

📸 **Para una valoración más precisa:**
Envíame una foto y puedo analizar:
• Estimación de % grasa corporal
• Puntos fuertes y áreas de mejora
• Simetría muscular
• Recomendaciones específicas

¿Qué aspecto quieres que profundicemos?`;
    },


    generateProgressReport(profile) {
        const workouts = Storage.getWorkoutHistory();
        const measurements = Storage.getMeasurements();
        const prs = Storage.getPRs();
        const week = Storage.getCurrentWeek();

        const totalWorkouts = workouts.length;
        const thisWeekWorkouts = workouts.filter(w => {
            const wDate = new Date(w.date);
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return wDate >= weekAgo;
        }).length;

        const prCount = Object.keys(prs).length;

        return `📈 **Reporte de Progreso**

📅 Semana ${week}/12 del programa

**📊 Estadísticas:**
• Total entrenamientos: ${totalWorkouts}
• Esta semana: ${thisWeekWorkouts}/${profile.daysPerWeek || 4} sesiones
• Records personales: ${prCount} PRs logrados
• Mediciones registradas: ${measurements.length}

**💪 Análisis:**
${totalWorkouts === 0 ? 
'¡Aún no has registrado entrenamientos! Empieza hoy y verás resultados en 2-3 semanas.' :
totalWorkouts < 10 ?
'Buen comienzo. La consistencia es lo que marca la diferencia. Sigue así y en el primer mes ya notarás cambios.' :
'¡Excelente constancia! Tu cuerpo ya está adaptándose. Los cambios visibles suelen notarse a partir de la semana 4-6.'}

**🎯 Para los próximos 7 días:**
• Completa todas tus ${profile.daysPerWeek || 4} sesiones
• Intenta superar 1 PR esta semana
• Registra tu peso 2-3 veces
• Duerme mínimo 7-8 horas
• Mantén la proteína alta (${Math.round((profile.weight || 70) * 2)}g/día)

**📐 Timeline realista:**
• Semana 1-2: Adaptación, DOMS, aprendes técnica
• Semana 3-4: Primeros gains de fuerza (neurales)
• Semana 5-8: Cambios visibles empiezan
• Semana 9-12: Transformación notable, ropa queda diferente
• Mes 3-4: Los demás empiezan a notar tu cambio

¡Sigue así! 🔥`;
    },

    generateSupplementAdvice(profile) {
        return `💊 **Guía de Suplementación (Basada en evidencia)**

**✅ ESENCIALES (funcionan, probados):**

1. **🥤 Proteína Whey** - ${Math.round((profile.weight || 70) * 0.5)}g/día si no llegas con comida
   • Tómala post-entreno o cuando necesites completar proteína
   • Busca una con >80% de proteína por scoop

2. **💎 Creatina Monohidrato** - 5g/día TODOS los días
   • El suplemento más estudiado y efectivo
   • +5-10% fuerza y volumen muscular
   • No necesitas fase de carga, solo 5g diarios
   • Tómala cuando quieras, consistencia > timing

3. **☀️ Vitamina D** - 2000-4000 IU/día
   • Especialmente si no te da mucho el sol
   • Impacta testosterona, inmunidad y rendimiento

4. **😴 Magnesio** - 400mg antes de dormir
   • Mejora sueño y recuperación
   • La mayoría somos deficientes

**⚠️ OPCIONALES (ayudan un poco):**
• Cafeína pre-entreno: 3-6mg/kg (mejora rendimiento 3-5%)
• Omega-3: 2-3g/día (antiinflamatorio)
• Beta-Alanina: 3-5g/día (resistencia muscular)

**❌ NO GASTES DINERO EN:**
• BCAAs (ya los tienes en whey y comida)
• Quemadores de grasa (marketing puro)
• Testosterona "natural" (no funcionan)
• Glutamina (no mejora nada si comes bien)

💡 Prioridad: Sueño > Nutrición > Entreno > Suplementos
Los suplementos representan máximo un 5% de tus resultados.`;
    },

    generateMotivation(profile) {
        const motivations = [
            `🔥 **Escucha esto, ${profile.name || 'crack'}:**\n\nEl gym no se trata de motivación, se trata de DISCIPLINA. La motivación va y viene, pero la disciplina es lo que construye físicos.\n\n¿Sabes qué pasa cuando entrenas sin ganas? Que esos son los entrenamientos que MÁS cuentan. Porque ahí es donde te separas del 90% que se rinde.\n\nNo tienes que sentirte motivado. Solo tienes que ir. El peor entreno es mejor que ningún entreno.\n\n💪 Tu yo del futuro te agradecerá cada sesión de hoy.`,
            `⚡ **${profile.name || 'Bro'}, piensa en esto:**\n\nCada rep que haces está construyendo la mejor versión de ti mismo. Literalmente estás remodelando tu cuerpo célula por célula.\n\nEn 3 meses la gente va a preguntar "¿qué hiciste?" Y la respuesta será: no me rendí cuando no quería ir.\n\n🎯 Plan para hoy: Solo ve. Haz el calentamiento. Si después de 10 minutos sigues sin ganas, te vas. (Spoiler: NUNCA te irás)\n\nEl éxito es la suma de pequeños esfuerzos repetidos día tras día.`,
            `💪 **La verdad, ${profile.name || 'máquina'}:**\n\nTu cuerpo no cambia cuando es fácil. Cambia cuando es difícil y sigues adelante.\n\nRecuerda por qué empezaste. Visualiza cómo quieres verte. Ese físico no se construye solo con los días buenos.\n\n📊 Dato: Solo el 8% de la gente mantiene sus objetivos fitness más de 3 meses. Tú vas a ser parte de ese 8%.\n\n🔑 Hack: Pon tu ropa de gym lista, pon música que te prenda, y solo SAL de tu casa. El resto fluye solo.`
        ];
        return motivations[Math.floor(Math.random() * motivations.length)];
    },

    generateRecoveryAdvice(profile) {
        return `😴 **Guía de Recuperación Óptima**

La recuperación es DONDE CRECES. No en el gym.

**🌙 Sueño (LO MÁS IMPORTANTE):**
• Mínimo 7-9 horas por noche
• Horario consistente (misma hora cada día)
• Cuarto oscuro y fresco (18-20°C)
• Sin pantallas 1h antes de dormir
• Magnesio 400mg antes de dormir ayuda mucho

**🧘 Recuperación activa:**
• Día de descanso ≠ día en el sofá
• Camina 8000-10000 pasos diarios
• Estiramientos/yoga 10-15min
• Foam roller en músculos tensos

**🍽️ Nutrición para recovery:**
• Proteína cada 3-4 horas (30-40g por toma)
• Carbohidratos post-entreno (repone glucógeno)
• Hidratación: ${Math.round((profile.weight || 70) * 0.035)}L agua mínimo

**❄️ Otras estrategias:**
• Ducha fría 2-3min post-entreno (reduce inflamación)
• Sauna si tienes acceso (mejora circulación)
• Masaje/automasaje 1-2x semana

**⚠️ Señales de sobreentrenamiento:**
• Rendimiento baja varias sesiones seguidas
• Fatiga constante incluso con buen sueño
• Irritabilidad/mal humor persistente
• Dolor articular (no muscular)
• Solución: Toma 3-5 días de descanso total

💡 Regla: Si dudas entre entrenar o descansar, DESCANSA. Siempre puedes entrenar mañana.`;
    },

    generateGeneralAdvice(profile, periodWeek) {
        const week = Storage.getCurrentWeek();
        return `👋 ¡Hola ${profile.name || 'crack'}! Soy tu coach de IA.

📅 **Estás en la semana ${week}/12 - Fase: ${periodWeek.phase}**
⚡ Intensidad objetivo: RPE ${periodWeek.rpe}

**¿En qué puedo ayudarte hoy?**

Puedo ayudarte con:
• 💪 Crear/ajustar tu rutina de entrenamiento
• 🥗 Plan nutricional y macros personalizados
• 📊 Valoración de tu estado físico
• 📈 Análisis de tu progreso
• 💊 Guía de suplementación
• 📸 Analizar fotos de tu físico
• 😴 Consejos de recuperación
• 🔥 Motivación cuando la necesites

Pregúntame lo que quieras, estoy aquí para que logres tus objetivos en estos ${12 - week + 1} semanas restantes. 💪`;
    },

    localImageAnalysis(question) {
        return `📸 **Análisis de Imagen**

Para darte una valoración precisa de tu físico por foto, necesito que configures tu API Key de OpenAI en Perfil > Configuración.

Sin embargo, puedo darte consejos generales:

**Para una buena foto de progreso:**
• Misma iluminación siempre
• Misma hora del día (mañana en ayunas es ideal)
• Mismas poses: frontal relajado, frontal flex, lateral, espalda
• Sin filtros ni edición

**Cuando configures la API, podré:**
• Estimar tu % de grasa corporal
• Identificar grupos musculares fuertes/débiles
• Evaluar simetría
• Comparar con fotos anteriores
• Dar recomendaciones específicas

Ve a ⚙️ Configuración y añade tu API Key de OpenAI para activar el análisis visual con IA.`;
    },

    // Generar rutina personalizada completa
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
            description: `Generada por IA - Semana ${week} - ${periodWeek.phase}`,
            template: templateKey,
            days: template.days.map(day => ({
                name: day.name,
                exercises: day.exercises.map(exId => {
                    const exercise = EXERCISES_DB.find(e => e.id === exId);
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
