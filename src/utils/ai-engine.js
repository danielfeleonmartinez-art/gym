// ===== AI ENGINE v7.0 - Smart Local AI + Groq Fallback =====
const AIEngine = {
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyOverride: null,

    getKey() {
        // Allow user to set their own API key in settings
        const settings = Storage.getSettings();
        if (settings.apiKey && settings.apiKey.length > 10) return settings.apiKey;
        if (this.apiKeyOverride) return this.apiKeyOverride;
        return null; // No hardcoded key - use local AI
    },

    isBlocked(text) {
        const b = ['porno','desnud','xxx','onlyfans','pedofil','prostitu'];
        return b.some(w => text.toLowerCase().includes(w));
    },

    getUserData() {
        const p = Storage.getProfile();
        const w = p.weight||70, h = p.height||175, a = p.age||25, g = p.gender||'hombre';
        const bmi = (w/((h/100)**2)).toFixed(1);
        const bmr = g==='mujer' ? 10*w+6.25*h-5*a-161 : 10*w+6.25*h-5*a+5;
        const tdee = Math.round(bmr*1.55);
        const week = Storage.getCurrentWeek();
        const pw = PERIODIZATION.weeks[week-1]||PERIODIZATION.weeks[0];
        return {p,w,h,a,g,bmi,bmr:Math.round(bmr),tdee,week,pw,prs:Storage.getPRs(),workouts:Storage.getWorkoutHistory()};
    },

    async generateResponse(prompt) {
        if (this.isBlocked(prompt)) return 'No puedo ayudar con eso.';
        const lower = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

        if (['creame','hazme','arma mi','genera mi','crea mi','necesito una rutina'].some(t=>lower.includes(t)) && lower.includes('rutina')) {
            return this.createRoutine();
        }

        // Try Groq API if key is available
        const key = this.getKey();
        if (key) {
            try {
                const result = await this.callGroq(prompt);
                if (result) return result;
            } catch(e) {
                console.error('Groq error:', e);
            }
        }

        // Smart local AI fallback (always works)
        return this.smartLocalAI(prompt, lower);
    },

    async callGroq(prompt) {
        const key = this.getKey();
        if (!key) return null;
        
        const d = this.getUserData();
        const sys = `Eres un coach de fitness, nutricionista y experto en ciencia del ejercicio. Respondes CUALQUIER pregunta sobre ejercicios, musculos, tecnicas, nutricion, suplementos, salud fisica, anatomia, biomecanica, lesiones, recuperacion, programacion de entrenamiento, y todo lo relacionado con el rendimiento deportivo y el cuerpo humano.

DATOS DEL USUARIO:
- Nombre: ${d.p.name||'Atleta'} | ${d.w}kg | ${d.h}cm | ${d.a} anos | ${d.g}
- IMC: ${d.bmi} | TDEE: ${d.tdee} kcal
- Objetivo: ${d.p.goal||'ganar musculo'} | Nivel: ${d.p.level||'intermedio'}
- Semana ${d.week}/12 | Fase: ${d.pw.phase} | RPE: ${d.pw.rpe}
- Entrenamientos: ${d.workouts.length} | PRs: ${Object.keys(d.prs).length}

REGLAS:
1. Responde SIEMPRE en espanol
2. NO uses emojis NUNCA
3. Se directo, practico y basado en evidencia
4. Da numeros concretos (kg, series, reps, kcal, gramos)
5. Si preguntan por un ejercicio, explica: tecnica paso a paso, musculos trabajados, errores comunes, variantes
6. Personaliza todo al perfil del usuario
7. Formato limpio con ** para negritas y listas con -`;

        const history = Storage.getChatHistory().slice(-8);
        const messages = [{role:'system',content:sys}];
        history.forEach(m => messages.push({role:m.role==='ai'?'assistant':'user',content:m.content}));
        messages.push({role:'user',content:prompt});

        const r = await fetch(this.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 2048,
                temperature: 0.7
            })
        });

        if (!r.ok) {
            console.error('Groq HTTP error:', r.status);
            return null;
        }

        const data = await r.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            let text = data.choices[0].message.content;
            text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu,'');
            return text.trim();
        }
        return null;
    },

    async analyzeImage(base64) {
        const d = this.getUserData();
        const bf = d.g==='mujer'?(1.2*parseFloat(d.bmi)+0.23*d.a-5.4):(1.2*parseFloat(d.bmi)+0.23*d.a-16.2);
        const est = Math.max(5,Math.min(45,bf)).toFixed(0);
        const losing = (d.p.goal||'').includes('perder') || parseFloat(d.bmi) > 25;
        const cal = losing ? Math.round(d.tdee-400) : Math.round(d.tdee+300);

        // Try Groq for analysis if key available
        const key = this.getKey();
        if (key) {
            try {
                const prompt = `Analiza el fisico de este usuario basandote en sus datos: ${d.w}kg, ${d.h}cm, IMC ${d.bmi}, grasa estimada ~${est}%, objetivo ${d.p.goal||'ganar musculo'}, nivel ${d.p.level||'intermedio'}. Da una valoracion completa: estado actual, puntos fuertes probables, areas de mejora, plan de accion de 4 semanas con calorias (${cal} kcal), proteina (${Math.round(d.w*2.2)}g), rutina y cardio. Se directo y honesto.`;
                const result = await this.callGroq(prompt);
                if (result) return result;
            } catch(e) {}
        }

        // Local analysis (always works)
        const prot = Math.round(d.w*2.2);
        const bench = d.prs['bench-press']?d.prs['bench-press'].weight:0;
        const squat = d.prs['squat']?d.prs['squat'].weight:0;
        
        let analysis = `**Valoracion Fisica**\n\n`;
        analysis += `**Datos:**\n- Peso: ${d.w}kg | Altura: ${d.h}cm\n- IMC: ${d.bmi} | Grasa estimada: ~${est}%\n- Nivel: ${d.p.level||'intermedio'} | Objetivo: ${d.p.goal||'ganar musculo'}\n\n`;
        analysis += `**Estado actual:**\n`;
        if (parseFloat(est) > 20) analysis += `- Capa de grasa cubriendo la musculatura. La definicion no sera visible hasta bajar de ~15%.\n`;
        else if (parseFloat(est) > 15) analysis += `- Estado atletico con algo de grasa residual. Buena base para definir o hacer lean bulk.\n`;
        else analysis += `- Buena definicion muscular. Estado de fitness visible.\n`;
        
        analysis += `\n**Plan de accion (4 semanas):**\n`;
        analysis += `- Calorias: **${cal} kcal/dia** (${losing?'deficit':'superavit'})\n`;
        analysis += `- Proteina: **${prot}g/dia** (${(prot/d.w).toFixed(1)}g/kg)\n`;
        analysis += `- Entreno: ${d.p.daysPerWeek||4}x/semana con progresion de cargas\n`;
        analysis += `- Cardio: ${losing?'LISS 3-4x/semana 25min + 10k pasos':'2-3x/semana 20min ligero'}\n`;
        analysis += `- Sueno: 7-9 horas minimo\n\n`;
        analysis += `**Objetivo a 4 semanas:** ${losing?(d.w-2.5).toFixed(1):(d.w+1.5).toFixed(1)}kg\n`;
        analysis += `**Objetivo a 12 semanas:** ${losing?(d.w-7).toFixed(1):(d.w+4).toFixed(1)}kg\n\n`;
        analysis += `Para un plan mas detallado, preguntame "plan nutricional completo" o "creame una rutina".`;
        
        return analysis;
    },

    localFallback(prompt, input) {
        return this.smartLocalAI(prompt, input);
    },

    smartLocalAI(prompt, input) {
        const d = this.getUserData();
        const lower = input || prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

        // Greeting
        if (['hola','buenas','que tal','hey','hello'].some(k=>lower.includes(k))) {
            return `**Hola ${d.p.name||'crack'}!**\n\nSemana ${d.week}/12 - Fase: ${d.pw.phase}\nRPE objetivo: ${d.pw.rpe} | Intensidad: ${d.pw.intensity}%\n\nPuedo ayudarte con:\n- **"Que entreno hoy?"** - Tu sesion del dia\n- **"Plan nutricional"** - Macros y calorias\n- **"Creame una rutina"** - Rutina personalizada\n- **"Suplementos"** - Guia de suplementacion\n- **"Como hago [ejercicio]?"** - Tecnica detallada\n- **"Estoy estancado"** - Consejos para superar mesetas\n- **"Valoracion"** - Analisis de tu progreso`;
        }

        // Workout today
        if (['que hago hoy','que entreno','entrenamiento','que toca','voy al gym','workout'].some(k=>lower.includes(k))) return this.genWorkout(d);
        
        // Nutrition
        if (['nutri','dieta','caloria','macro','proteina','que como','comida','alimenta'].some(k=>lower.includes(k))) return this.genNutritionDetailed(d);
        
        // Supplements  
        if (['suplement','creatina','whey','proteina en polvo','bcaa','pre-entreno','pre entreno'].some(k=>lower.includes(k))) return this.genSupplements(d);
        
        // Plateau/stagnation
        if (['estancad','plateau','meseta','no avanzo','no progreso','atascad'].some(k=>lower.includes(k))) return this.genPlateauAdvice(d);
        
        // Valoracion/assessment
        if (['valoracion','evaluacion','estado','como voy','progreso','assessment'].some(k=>lower.includes(k))) return this.genAssessment(d);
        
        // Recovery/rest
        if (['descanso','recuper','dormir','sueno','overtraining','sobreentren'].some(k=>lower.includes(k))) return this.genRecovery(d);
        
        // Specific exercise technique
        const exerciseMatch = EXERCISES_DB.find(ex => lower.includes(ex.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").substring(0,8)));
        if (exerciseMatch) return this.genExerciseDetail(exerciseMatch, d);
        
        // Muscle group specific
        if (['pecho','pectoral','bench'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Pecho', d);
        if (['espalda','dorsal','lat','pull'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Dorsales', d);
        if (['hombro','deltoid','press militar'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Hombros', d);
        if (['pierna','cuadricep','squat','sentadilla'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Cuádriceps', d);
        if (['bicep','curl'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Bíceps', d);
        if (['tricep','extension','pushdown'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Tríceps', d);
        if (['gluteo','hip thrust','cadera'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Glúteos', d);
        if (['isquio','femoral','hamstring'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Isquiotibiales', d);
        if (['core','abdomen','abs','abdominal'].some(k=>lower.includes(k))) return this.genMuscleAdvice('Core', d);
        
        // Cardio
        if (['cardio','correr','aerobico','hiit','liss'].some(k=>lower.includes(k))) return this.genCardio(d);
        
        // Weight loss / gain
        if (['perder','bajar de peso','definir','cutting','cut','secar'].some(k=>lower.includes(k))) return this.genWeightLoss(d);
        if (['ganar','subir','volumen','bulking','bulk','masa'].some(k=>lower.includes(k))) return this.genWeightGain(d);
        
        // Injury/pain
        if (['lesion','dolor','duele','molestia','tendinitis','injury'].some(k=>lower.includes(k))) return this.genInjuryAdvice(d);

        // Flexibility/mobility
        if (['flexibilidad','movilidad','estirar','stretching','calentamiento','warmup'].some(k=>lower.includes(k))) return this.genMobility(d);
        
        // Default comprehensive response
        return this.genDefaultResponse(d);
    },

    genWorkout(d) {
        const days=d.p.daysPerWeek||4;const tKey=days<=3?'fullBody':days===4?'upperLower':'ppl';
        const t=ROUTINE_TEMPLATES[tKey];const wk=d.workouts.filter(w=>{const dt=new Date(w.date),now=new Date(),mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));mon.setHours(0,0,0,0);return dt>=mon}).length;
        const plan=t.days[wk%t.days.length];let r=`**${plan.name}**\nSemana ${d.week}/12 | Fase: ${d.pw.phase} | RPE ${d.pw.rpe}\n${d.pw.deload?'** SEMANA DE DELOAD - Reduce peso al 60%**\n':''}\n`;
        plan.exercises.forEach((id,i)=>{const ex=EXERCISES_DB.find(e=>e.id===id);if(!ex)return;const pr=d.prs[id];const sugWeight=pr?Math.round(pr.weight*(d.pw.intensity/100)):Math.round(d.w*(ex.category==='compound'?0.5:0.2));r+=`${i+1}. **${ex.name}** - ${ex.sets}x${ex.reps} | ~${sugWeight}kg | Descanso: ${ex.rest}s${pr?' (PR: '+pr.weight+'kg)':''}\n`;});
        r+=`\n**Notas:**\n- Calentamiento: 5-10 min cardio ligero + series de aproximacion\n- Si no completas todas las reps, repite el peso la proxima sesion\n- Hidratacion: 500ml agua por cada 30min de entreno`;
        return r;
    },
    genNutrition(d) {
        return this.genNutritionDetailed(d);
    },
    genNutritionDetailed(d) {
        const goal=d.p.goal||'ganar musculo';const losing=goal.includes('perder')||parseFloat(d.bmi)>27;
        const tc=losing?d.tdee-400:goal.includes('fuerza')?d.tdee+200:d.tdee+300;
        const prot=Math.round(d.w*2.2),fat=Math.round(d.w*0.9),carb=Math.round((tc-prot*4-fat*9)/4);
        let r=`**Plan Nutricional Personalizado**\n\nPeso: ${d.w}kg | Objetivo: ${goal}\nTDEE estimado: ${d.tdee} kcal/dia\n\n**Calorias objetivo: ${tc} kcal/dia** (${losing?'deficit de 400kcal':'superavit de '+(tc-d.tdee)+'kcal'})\n\n**Macros diarios:**\n- Proteina: **${prot}g** (${Math.round(prot*4)} kcal) - 2.2g/kg\n- Carbohidratos: **${carb}g** (${Math.round(carb*4)} kcal)\n- Grasas: **${fat}g** (${Math.round(fat*9)} kcal)\n\n`;
        r+=`**Distribucion en 4 comidas:**\n\n`;
        r+=`**Desayuno (${Math.round(tc*0.25)} kcal):**\n- ${Math.round(prot*0.25)}g proteina + ${Math.round(carb*0.3)}g carbos + ${Math.round(fat*0.25)}g grasa\n- Ejemplo: Avena con whey, platano y nueces\n\n`;
        r+=`**Almuerzo (${Math.round(tc*0.3)} kcal):**\n- ${Math.round(prot*0.3)}g proteina + ${Math.round(carb*0.3)}g carbos + ${Math.round(fat*0.3)}g grasa\n- Ejemplo: Pollo/carne con arroz y verduras\n\n`;
        r+=`**Pre/Post entreno (${Math.round(tc*0.25)} kcal):**\n- ${Math.round(prot*0.25)}g proteina + ${Math.round(carb*0.3)}g carbos + ${Math.round(fat*0.15)}g grasa\n- Ejemplo: Arroz con atun + fruta post entreno\n\n`;
        r+=`**Cena (${Math.round(tc*0.2)} kcal):**\n- ${Math.round(prot*0.2)}g proteina + ${Math.round(carb*0.1)}g carbos + ${Math.round(fat*0.3)}g grasa\n- Ejemplo: Salmon/huevos con ensalada y aguacate\n\n`;
        r+=`**Hidratacion:** ${Math.round(d.w*0.035*1000)}ml agua/dia minimo`;
        return r;
    },
    genSupplements(d) {
        const prot=Math.round(d.w*2.2);
        return `**Guia de Suplementacion** (${d.w}kg, objetivo: ${d.p.goal||'ganar musculo'})\n\n**Tier 1 - Esenciales (respaldo cientifico fuerte):**\n1. **Creatina monohidrato** - 5g/dia, todos los dias\n   - Aumenta fuerza 5-10%, masa muscular, rendimiento\n   - No necesita fase de carga, tomar con cualquier comida\n\n2. **Proteina Whey** - ${Math.max(0,prot-Math.round(d.w*1.5))}g si no llegas a ${prot}g con comida\n   - Post-entreno o cuando necesites completar proteina\n   - Whey isolate si eres intolerante a lactosa\n\n3. **Vitamina D3** - 2000-4000 IU/dia\n   - Esencial si no tomas sol 20+ min/dia\n   - Tomar con grasa para absorcion\n\n**Tier 2 - Utiles:**\n4. **Magnesio** (glicinato) - 300-400mg antes de dormir\n   - Mejora sueno y recuperacion\n5. **Omega-3** (EPA/DHA) - 2-3g/dia\n   - Anti-inflamatorio, salud cardiovascular\n6. **Cafeina** - 3-6mg/kg pre-entreno (${Math.round(d.w*4)}mg)\n   - 30-60 min antes de entrenar\n\n**NO necesitas:** BCAAs (si comes suficiente proteina), glutamina, testosterone boosters, quemadores de grasa.`;
    },

    genPlateauAdvice(d) {
        const weeks = d.week;
        const workoutCount = d.workouts.length;
        return `**Como Superar tu Estancamiento**\n\nSemana ${weeks}/12 | ${workoutCount} sesiones completadas\n\n**Estrategias inmediatas:**\n\n1. **Cambiar el estimulo** (elige 1-2):\n   - Varia el rango de reps: si haces 8-10, prueba 5-6 pesado o 12-15 ligero\n   - Cambia el tempo: excéntrica de 3-4 segundos\n   - Cambia el orden de ejercicios\n   - Añade tecnicas de intensidad: drop sets, rest-pause, myo-reps\n\n2. **Revisa tu recuperacion:**\n   - Duermes 7-9h? (la hormona de crecimiento se libera en sueno profundo)\n   - Comes suficiente? Necesitas ${Math.round(d.w*2.2)}g proteina/dia\n   - Estas en deficit muy agresivo? Sube calorias 200kcal\n\n3. **Progresion inteligente:**\n   - No solo subas peso. Tambien puedes: +1 rep, +1 serie, -descanso\n   - Microcargas: +1.25kg en vez de +2.5kg\n   - Double progression: cuando logres el tope de reps en todas las series, sube peso\n\n4. **Deload estrategico:**\n   - ${d.pw.deload?'ESTAS en semana de deload - aprovechala!':'Considera tomar una semana al 60% de peso'}\n   - No es perder tiempo, es invertir en supercompensacion\n\n**Plan de accion esta semana:**\n- Duerme 8h minimo\n- Come ${Math.round(d.tdee+200)} kcal con ${Math.round(d.w*2.2)}g proteina\n- En tu proximo entreno, cambia el tempo a 3-1-1 (excéntrica-pausa-concentrica)`;
    },

    genAssessment(d) {
        const workoutCount = d.workouts.length;
        const prs = Object.keys(d.prs).length;
        const bf = d.g==='mujer'?(1.2*parseFloat(d.bmi)+0.23*d.a-5.4):(1.2*parseFloat(d.bmi)+0.23*d.a-16.2);
        const estBf = Math.max(5,Math.min(45,bf)).toFixed(0);
        const bench=d.prs['bench-press']?d.prs['bench-press'].weight:0;
        const squat=d.prs['squat']?d.prs['squat'].weight:0;
        const dead=d.prs['deadlift']?d.prs['deadlift'].weight:0;
        
        let level = 'Principiante';
        if (bench/d.w>1.2 && squat/d.w>1.5 && dead/d.w>1.8) level = 'Avanzado';
        else if (bench/d.w>0.8 && squat/d.w>1.0 && dead/d.w>1.2) level = 'Intermedio';
        
        return `**Valoracion de Progreso**\n\n**Datos:**\n- Peso: ${d.w}kg | Altura: ${d.h}cm | IMC: ${d.bmi}\n- Grasa corporal estimada: ~${estBf}%\n- Masa muscular estimada: ~${Math.round(d.w*(1-estBf/100)*0.45)}kg\n\n**Fuerza (PRs registrados: ${prs}):**\n- Press banca: ${bench?bench+'kg ('+((bench/d.w).toFixed(2))+'x peso corporal)':'Sin registrar'}\n- Sentadilla: ${squat?squat+'kg ('+((squat/d.w).toFixed(2))+'x peso corporal)':'Sin registrar'}\n- Peso muerto: ${dead?dead+'kg ('+((dead/d.w).toFixed(2))+'x peso corporal)':'Sin registrar'}\n- Nivel estimado: **${level}**\n\n**Consistencia:**\n- Sesiones totales: ${workoutCount}\n- Semana actual: ${d.week}/12\n- Frecuencia objetivo: ${d.p.daysPerWeek||4}x/semana\n\n**Recomendaciones:**\n${estBf>20?'- Prioriza perder grasa manteniendo fuerza (deficit moderado)\n':''}${estBf<15?'- Buen nivel de definicion. Puedes hacer lean bulk controlado\n':''}${bench===0?'- Registra tus PRs para trackear progresion\n':''}${workoutCount<10?'- Enfocate en consistencia: no faltes a ninguna sesion esta semana\n':'- Buena consistencia! Enfocate en progresion de cargas\n'}`;
    },

    genRecovery(d) {
        return `**Guia de Recuperacion y Descanso**\n\n**Sueno (LO MAS IMPORTANTE):**\n- Objetivo: 7-9 horas de sueno de calidad\n- Rutina: misma hora de acostarse +/-30min\n- Habitacion fria (18-20C), oscura, sin pantallas 1h antes\n- Suplementos: Magnesio glicinato 300-400mg, melatonina 0.5-1mg solo si necesario\n\n**Recuperacion activa (dias de descanso):**\n- Caminar 30-60min (mejora flujo sanguineo)\n- Foam rolling 10-15min en musculos trabajados\n- Estiramientos suaves (no agresivos post-entreno intenso)\n- Sauna/bano caliente 15-20min\n\n**Nutricion para recuperacion:**\n- Proteina distribuida en 4 comidas de ${Math.round(d.w*2.2/4)}g cada una\n- Carbohidratos post-entreno para reponer glucogeno\n- Hidratacion: ${Math.round(d.w*35)}ml agua/dia\n\n**Senales de sobreentrenamiento:**\n- Rendimiento estancado o bajando 2+ semanas\n- Fatiga constante, mal humor, insomnio\n- Dolor articular persistente\n- Frecuencia cardiaca en reposo elevada\n\n**Si tienes estas senales:**\n- Toma 5-7 dias de deload (50-60% de peso normal)\n- Duerme 9+ horas\n- Come en mantenimiento o ligero superavit`;
    },

    genExerciseDetail(ex, d) {
        const pr = d.prs[ex.id];
        const sugWeight = pr ? Math.round(pr.weight*0.8) : Math.round(d.w*(ex.category==='compound'?0.5:0.2));
        return `**${ex.name}**\n\nMusculo principal: ${ex.muscle}\nSecundarios: ${ex.secondary.length>0?ex.secondary.join(', '):'Ninguno'}\nCategoria: ${ex.category==='compound'?'Compuesto (multi-articular)':'Aislamiento'}\nEquipamiento: ${ex.equipment}\n\n**Parametros recomendados:**\n- Series: ${ex.sets} | Reps: ${ex.reps} | Descanso: ${ex.rest}s\n- Peso sugerido: ~${sugWeight}kg${pr?' (PR actual: '+pr.weight+'kg)':''}\n\n**Tecnica:**\n${ex.tips.map((t,i)=>`${i+1}. ${t}`).join('\n')}\n\n**Descripcion:**\n${ex.description}\n\n**Progresion:**\n- Cuando completes ${ex.reps.toString().includes('-')?'el tope del rango ('+ex.reps.split('-')[1]+' reps)':'todas las reps'} con buena tecnica en TODAS las series, sube ${ex.category==='compound'?'2.5kg':'1-2kg'}\n- Si no llegas al minimo de reps, baja 5-10% de peso`;
    },

    genMuscleAdvice(muscle, d) {
        const exercises = EXERCISES_DB.filter(e=>e.muscle===muscle).slice(0,8);
        const compounds = exercises.filter(e=>e.category==='compound');
        const isolations = exercises.filter(e=>e.category==='isolation');
        return `**Entrenamiento de ${muscle}**\n\nNivel: ${d.p.level||'intermedio'} | Peso corporal: ${d.w}kg\n\n**Mejores ejercicios compuestos:**\n${compounds.slice(0,4).map((e,i)=>`${i+1}. **${e.name}** - ${e.sets}x${e.reps} (${e.equipment})`).join('\n')}\n\n**Mejores ejercicios de aislamiento:**\n${isolations.slice(0,4).map((e,i)=>`${i+1}. **${e.name}** - ${e.sets}x${e.reps} (${e.equipment})`).join('\n')}\n\n**Volumen semanal optimo:**\n- Principiante: 10-12 series/semana\n- Intermedio: 12-18 series/semana\n- Avanzado: 16-22 series/semana\n\n**Orden recomendado:**\n1. Compuestos pesados primero (6-10 reps)\n2. Compuestos accesorios (8-12 reps)\n3. Aislamientos (12-20 reps)\n\n**Tips para maximizar:**\n- Progresion semanal: +2.5kg en compuestos cuando completes todas las reps\n- Conexion mente-musculo en aislamientos\n- Rango completo de movimiento SIEMPRE`;
    },

    genCardio(d) {
        const losing = (d.p.goal||'').includes('perder') || parseFloat(d.bmi)>25;
        return `**Plan de Cardio** (${d.w}kg | Objetivo: ${d.p.goal||'ganar musculo'})\n\n${losing?'**Para perdida de grasa:**\n- LISS (baja intensidad): 3-5x/semana, 25-40min\n  - Caminar rapido, bici suave, eliptica\n  - FC: 120-140 lpm (zona 2)\n- HIIT (alta intensidad): 1-2x/semana, 15-20min\n  - Sprints 30s + descanso 60s\n  - Mejor despues de pesas o en dia separado\n\n**Orden de prioridad:**\n1. 10,000 pasos diarios (NO negociable)\n2. LISS post-pesas 20min\n3. 1-2 sesiones HIIT extra si el progreso se estanca':'**Para ganar musculo (cardio minimo):**\n- 2-3x/semana LISS suave, 20-30min\n- Objetivo: salud cardiovascular sin interferir con ganancias\n- Caminar 8,000-10,000 pasos diarios\n- EVITAR: cardio intenso antes de piernas\n- Si haces HIIT: maximo 1x/semana, separado de pesas'}\n\n**Frecuencia cardiaca optima:**\n- Zona 2 (quema grasa): ${Math.round(0.6*(220-d.a))}-${Math.round(0.7*(220-d.a))} lpm\n- Zona 3 (HIIT): ${Math.round(0.8*(220-d.a))}-${Math.round(0.9*(220-d.a))} lpm\n\n**Importante:** El cardio NO reemplaza el deficit calorico para perder grasa. 500kcal de deficit > 1h de cardio.`;
    },

    genWeightLoss(d) {
        const deficit = d.tdee - 400;
        return `**Plan de Perdida de Grasa**\n\nPeso actual: ${d.w}kg | IMC: ${d.bmi}\nGrasa estimada: ~${Math.max(8,Math.round(1.2*parseFloat(d.bmi)+0.23*d.a-16.2))}%\n\n**Calorias:** ${deficit} kcal/dia (deficit de 400kcal)\n**Proteina:** ${Math.round(d.w*2.4)}g/dia (ALTA para preservar musculo)\n**Velocidad:** -0.5 a -0.7kg/semana (maximo)\n\n**Reglas de oro:**\n1. **Entrena fuerza** ${d.p.daysPerWeek||4}x/semana - NO reduzcas pesas\n2. Proteina alta en CADA comida\n3. 10,000 pasos diarios (quema ~300-500kcal extra)\n4. Deficit MODERADO - si bajas muy rapido pierdes musculo\n5. Duerme 7-9h (cortisol = retencion)\n\n**Errores comunes:**\n- Hacer solo cardio sin pesas (pierdes musculo)\n- Deficit muy agresivo (>600kcal = metabolismo baja)\n- Eliminar carbos (necesitas energia para entrenar)\n- Pesarse todos los dias (el peso fluctua 1-2kg por agua)\n\n**Timeline realista:**\n- 4 semanas: -2 a -3kg\n- 8 semanas: -4 a -6kg\n- 12 semanas: -6 a -8kg\n\nObjeto de peso a 12 semanas: ~${(d.w-7).toFixed(1)}kg`;
    },

    genWeightGain(d) {
        const surplus = d.tdee + 300;
        return `**Plan de Ganancia Muscular**\n\nPeso actual: ${d.w}kg | Nivel: ${d.p.level||'intermedio'}\n\n**Calorias:** ${surplus} kcal/dia (superavit de 300kcal)\n**Proteina:** ${Math.round(d.w*2)}g/dia\n**Velocidad:** +0.25 a +0.5kg/semana (lean bulk)\n\n**Claves para ganar musculo LIMPIO:**\n1. Superavit CONTROLADO (+200-400kcal, no +1000)\n2. Proteina distribuida en 4 comidas\n3. Entrena ${d.p.daysPerWeek||4}x/semana con PROGRESION\n4. Duerme 8+ horas (HGH se libera durmiendo)\n5. Compuestos pesados como base\n\n**Progresion de cargas:**\n- Sube 2.5kg en compuestos cuando logres todas las reps\n- Sube 1-2kg en aislamientos\n- Si no progresas 2 semanas: cambia el estimulo\n\n**Comidas clave:**\n- Pre-entreno: carbos + proteina (1-2h antes)\n- Post-entreno: proteina + carbos rapidos (30min despues)\n- Antes de dormir: caseina o alimento de digestion lenta\n\n**Timeline realista:**\n- Principiante: +0.5-1kg musculo/mes\n- Intermedio: +0.25-0.5kg musculo/mes\n- Avanzado: +0.1-0.25kg musculo/mes\n\nPeso objetivo a 12 semanas: ~${(d.w+3.5).toFixed(1)}kg`;
    },

    genInjuryAdvice(d) {
        return `**Manejo de Molestias y Lesiones**\n\n**IMPORTANTE:** Si el dolor es agudo, persistente o limita tu movimiento, consulta un fisioterapeuta. Esto es orientacion general.\n\n**Protocolo RICE inmediato:**\n- Rest: Reduce la carga en la zona afectada\n- Ice: Hielo 15-20min cada 2-3 horas (primeras 48h)\n- Compression: Vendaje si hay inflamacion\n- Elevation: Eleva la zona si es extremidad\n\n**Reglas para entrenar con molestias:**\n1. Si duele DURANTE el ejercicio con buena tecnica: **PARA**\n2. Si es molestia leve que desaparece calentando: reduce peso 30-50%\n3. Busca variantes que no duelan (ejemplo: si duele bench, prueba floor press)\n4. Entrena otros musculos sin afectar la zona\n\n**Prevencion (hazlo SIEMPRE):**\n- Calentamiento progresivo: series de aproximacion\n- Face pulls y rotadores externos cada sesion\n- Movilidad de caderas y tobillos antes de piernas\n- Retraccion escapular en todos los ejercicios de press\n- No sacrifiques tecnica por peso NUNCA\n\n**Zonas comunes:**\n- Hombro: revisa retraccion escapular, reduce press inclinado\n- Lumbar: refuerza core, revisa tecnica de deadlift\n- Rodilla: quad/isquio balance, movilidad de tobillo\n- Codo: reduce volumen de biceps/triceps, mejora calentamiento`;
    },

    genMobility(d) {
        return `**Rutina de Movilidad y Calentamiento**\n\n**Pre-entreno (5-8 minutos):**\n1. Cardio ligero: 3-5 min (bici, caminar rapido)\n2. Movilidad articular:\n   - Circulos de hombros: 10 cada direccion\n   - Rotacion de caderas: 10 cada lado\n   - Cat-cow: 10 reps\n   - World's greatest stretch: 5 cada lado\n3. Activacion muscular:\n   - Band pull-aparts: 15 reps\n   - Glute bridges: 15 reps\n   - Dead bugs: 10 cada lado\n\n**Series de aproximacion (antes de cada ejercicio pesado):**\n- 1x12 con barra vacia o 30% de peso de trabajo\n- 1x8 con 50% de peso de trabajo\n- 1x5 con 70% de peso de trabajo\n- Luego: series de trabajo\n\n**Post-entreno (opcional, 5 min):**\n- Estiramientos estaticos 30-60s por musculo trabajado\n- Foam rolling en musculos mas tensos\n- Respiracion profunda 2 minutos\n\n**Movilidad para problemas comunes:**\n- Sentadilla profunda: movilidad de tobillo (knee-over-toe walks)\n- Press overhead: movilidad toracica (foam roller extension)\n- Dolor de hombro: rotacion externa con banda\n- Lumbar rigida: hip 90/90, pigeon stretch`;
    },

    genDefaultResponse(d) {
        return `**Coach IA - Respuesta**\n\nNo estoy seguro de lo que necesitas exactamente, pero puedo ayudarte con:\n\n**Entrenamiento:**\n- "Que entreno hoy?" - Tu sesion programada\n- "Como hago press de banca?" - Tecnica de cualquier ejercicio\n- "Creame una rutina" - Rutina personalizada\n- "Estoy estancado" - Consejos para superar mesetas\n\n**Nutricion:**\n- "Plan nutricional" - Macros y calorias detallados\n- "Que como?" - Plan de comidas\n- "Suplementos" - Guia completa\n\n**Cuerpo:**\n- "Quiero perder grasa" - Plan de definicion\n- "Quiero ganar musculo" - Plan de volumen\n- "Me duele [zona]" - Manejo de molestias\n- "Valoracion" - Tu estado actual\n\n**Recuperacion:**\n- "Descanso y recuperacion" - Guia completa\n- "Movilidad" - Rutina de estiramientos\n- "Cardio" - Plan cardiovascular\n\nPregunta lo que necesites de forma directa y te doy una respuesta personalizada (${d.w}kg, ${d.p.level||'intermedio'}, semana ${d.week}/12).`;
    },

    createRoutine() {
        const d=this.getUserData();const routine=this.generateCustomRoutine(d.p);Storage.saveRoutine(routine);
        return `**Rutina "${routine.name}" creada!**\n\n${routine.days.length} dias de entrenamiento.\nSemana ${d.week}/12 - Fase: ${d.pw.phase}\n\nVe a la pestana **Entreno** para ver tu rutina y empezar a entrenar.\n\nTips:\n- Los ejercicios estan ordenados de mayor a menor importancia\n- Empieza con los compuestos pesados cuando estas fresco\n- Progresa semanalmente: +2.5kg cuando completes todas las reps`;
    },
    generateCustomRoutine(profile) {
        const days=profile.daysPerWeek||4;const tKey=days<=3?'fullBody':days===4?'upperLower':days===5?'bro':'ppl';
        const t=ROUTINE_TEMPLATES[tKey];const week=Storage.getCurrentWeek();const pw=PERIODIZATION.weeks[week-1]||PERIODIZATION.weeks[0];
        return {id:'ai-'+Date.now(),name:t.name+' (IA)',description:'Semana '+week,template:tKey,days:t.days.map(day=>({name:day.name,exercises:day.exercises.map(id=>{const ex=EXERCISES_DB.find(e=>e.id===id);return ex?{...ex,targetSets:ex.sets,targetReps:ex.reps,intensity:pw.intensity,rpe:pw.rpe}:id;})})),weekCreated:week,phase:pw.phase,createdAt:new Date().toISOString()};
    }
};
