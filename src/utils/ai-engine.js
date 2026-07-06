// ===== AI ENGINE v5.0 - Intelligent Local + Optional API =====
const AIEngine = {
    ENDPOINTS: [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
    ],

    getApiKey() { return localStorage.getItem('gemini_api_key') || ''; },

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

        // Try routine creation
        if (['creame','hazme','arma mi','genera mi','crea mi','necesito una rutina'].some(t=>lower.includes(t)) && lower.includes('rutina')) {
            return this.createRoutine();
        }

        // Try API first if key exists
        const key = this.getApiKey();
        if (key && key.length > 10) {
            try {
                const result = await this.callAPI(prompt, key);
                if (result) return result;
            } catch(e) { console.log('API failed, using local'); }
        }

        // Local AI (always works)
        return this.localAI(prompt, lower);
    },

    async callAPI(prompt, key) {
        const d = this.getUserData();
        const sys = `Eres un coach fitness experto. Usuario: ${d.p.name||'Atleta'}, ${d.w}kg, ${d.h}cm, ${d.a} anos, objetivo: ${d.p.goal||'ganar musculo'}, nivel: ${d.p.level||'intermedio'}, semana ${d.week}/12. Responde en espanol. NO uses emojis. Se directo y da numeros concretos.`;
        const history = Storage.getChatHistory().slice(-6);
        const contents = [];
        history.forEach(m => contents.push({role: m.role==='ai'?'model':'user', parts:[{text:m.content}]}));
        contents.push({role:'user',parts:[{text:prompt}]});

        for (const url of this.ENDPOINTS) {
            try {
                const r = await fetch(`${url}?key=${key}`, {
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({
                        system_instruction:{parts:[{text:sys}]},
                        contents,
                        generationConfig:{temperature:0.7,maxOutputTokens:2048}
                    })
                });
                if (!r.ok) continue;
                const data = await r.json();
                if (data.candidates&&data.candidates[0]&&data.candidates[0].content) {
                    let text = data.candidates[0].content.parts[0].text;
                    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FAFF}]/gu,'');
                    return text.trim();
                }
            } catch(e) { continue; }
        }
        return null;
    },


    // ===== LOCAL AI - Works offline, answers everything =====
    localAI(prompt, input) {
        const d = this.getUserData();
        const name = d.p.name||'crack';

        // Greetings
        if (['hola','buenas','que tal','hey','buenos dias','buenas tardes'].some(k=>input.includes(k)))
            return `Hola ${name}. Semana ${d.week}/12, fase ${d.pw.phase}, RPE ${d.pw.rpe}. Preguntame lo que necesites.`;

        // Thanks
        if (['gracias','genial','perfecto','crack','excelente'].some(k=>input.includes(k)))
            return 'De nada. Cualquier duda, pregunta.';

        // Today workout
        if (['que hago hoy','que entreno','entrenamiento de hoy','que toca','voy al gym','entreno hoy','dame el entreno'].some(k=>input.includes(k)))
            return this.genWorkout(d);

        // Nutrition
        if (['nutri','dieta','comer','caloria','macro','proteina','carbohidrato','grasa','que como','cuanto debo comer','deficit','superavit'].some(k=>input.includes(k)))
            return this.genNutrition(d);

        // Supplements
        if (['suplement','creatina','whey','pre-entreno','vitamina','omega','batido'].some(k=>input.includes(k)))
            return this.genSupplements(d);

        // Injury
        if (['dolor','lesion','molestia','me duele','hombro duele','rodilla','espalda baja','lumbar','codo','tendinitis'].some(k=>input.includes(k)))
            return this.genInjury(input, d);

        // Progress/assessment
        if (['progreso','como voy','valoracion','evalua','como estoy','mi nivel','avance','resultado'].some(k=>input.includes(k)))
            return this.genAssessment(d);

        // Plateau
        if (['estancad','no progreso','plateau','no subo','no crezco','no veo resultado'].some(k=>input.includes(k)))
            return this.genPlateau(d);

        // Muscle specific
        if (['pecho','espalda','hombro','pierna','biceps','triceps','gluteo','abdomen','core'].some(m=>input.includes(m)) && ['entrena','dame','ejercicio','sesion','rutina de','trabajar'].some(a=>input.includes(a)))
            return this.genMuscleSession(input, d);

        // Exercise info
        if (['mejor ejercicio','como hacer','tecnica','alternativa','ejercicios para'].some(k=>input.includes(k)))
            return this.genExerciseInfo(input, d);

        // Program/routine
        if (['rutina','programa','plan de entrenamiento','ppl','upper lower','full body'].some(k=>input.includes(k)))
            return this.genProgram(d, input);

        // Cardio
        if (['cardio','correr','hiit','liss','quemar grasa','caminar','trotar'].some(k=>input.includes(k)))
            return this.genCardio(d);

        // Recovery/sleep
        if (['descanso','recuper','dormir','sueno','deload','sobreentren','fatiga'].some(k=>input.includes(k)))
            return this.genRecovery(d);

        // Motivation
        if (['motiv','no quiero','pereza','cansad','abandonar','no puedo','dificil'].some(k=>input.includes(k)))
            return this.genMotivation(d);

        // Weight
        if (['peso','bascula','subir de peso','bajar de peso','adelgazar','engordar'].some(k=>input.includes(k)))
            return this.genWeight(input, d);

        // Comparison
        if (['es mejor','diferencia','vs','que es mejor','conviene','deberia'].some(k=>input.includes(k)))
            return this.genComparison(input, d);

        // Volume/science
        if (['cuantas series','volumen','rpe','rir','al fallo','frecuencia','cuantos dias'].some(k=>input.includes(k)))
            return this.genScience(input, d);

        // Aesthetics
        if (['marcar','six pack','brazos grandes','espalda ancha','verse bien','estetica','como tener'].some(k=>input.includes(k)))
            return this.genAesthetic(input, d);

        // 1RM
        if (['1rm','maximo','repeticion maxima','calcula mi'].some(k=>input.includes(k)))
            return this.genOneRM(input, d);

        // Somatotype
        if (['somatotipo','ectomorfo','mesomorfo','endomorfo','tipo de cuerpo'].some(k=>input.includes(k)))
            return this.genSomatotype(d);

        // Definitions
        if (['que es','que significa','que son'].some(k=>input.includes(k)))
            return this.genDefinition(input, d);

        // Quantitative
        if (['cuanto','cuanta','cuantos'].some(k=>input.includes(k)))
            return this.genQuantitative(input, d);

        // Default - still give useful response
        return this.genDefault(prompt, d);
    },


    // ===== GENERATORS =====
    genWorkout(d) {
        const days = d.p.daysPerWeek||4;
        const tKey = days<=3?'fullBody':days===4?'upperLower':'ppl';
        const t = ROUTINE_TEMPLATES[tKey];
        const wThisWeek = d.workouts.filter(wk=>{const dt=new Date(wk.date),now=new Date(),mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));mon.setHours(0,0,0,0);return dt>=mon}).length;
        const plan = t.days[wThisWeek % t.days.length];
        let r = `**${plan.name}**\nSemana ${d.week}/12 | ${d.pw.phase} | RPE ${d.pw.rpe}\n\n`;
        plan.exercises.forEach((id,i) => {
            const ex = EXERCISES_DB.find(e=>e.id===id); if(!ex) return;
            const pr = d.prs[id]; const sw = pr ? Math.round(pr.weight*(d.pw.intensity/100)) : null;
            r += `${i+1}. **${ex.name}** - ${d.pw.deload?ex.sets-1:ex.sets}x${ex.reps}${sw?' | ~'+sw+'kg':''} | ${ex.rest}s\n`;
        });
        r += `\nDuracion: ${d.pw.deload?'40-50':'55-70'} min\n${d.pw.deload?'Deload: peso ligero, sin fallo.':'Ultima serie cerca del fallo (RPE '+d.pw.rpe+').'}`;
        return r;
    },

    genNutrition(d) {
        const goal = d.p.goal||'ganar musculo';
        const tc = goal.includes('perder')?d.tdee-400:goal.includes('ganar')?d.tdee+300:d.tdee;
        const prot = Math.round(d.w*2.2), fat = Math.round(d.w*0.9), carb = Math.round((tc-prot*4-fat*9)/4);
        return `**Plan Nutricional** (${d.w}kg | ${goal})\n\nTDEE: ${d.tdee} kcal\nObjetivo: **${tc} kcal/dia**\n\nMacros:\n- Proteina: **${prot}g** (${Math.round(prot*4/tc*100)}%)\n- Carbohidratos: **${carb}g** (${Math.round(carb*4/tc*100)}%)\n- Grasas: **${fat}g** (${Math.round(fat*9/tc*100)}%)\n\nDistribucion:\n- Desayuno: ~${Math.round(tc*0.25)} kcal\n- Almuerzo: ~${Math.round(tc*0.30)} kcal\n- Pre-entreno: ~${Math.round(tc*0.15)} kcal\n- Cena: ~${Math.round(tc*0.20)} kcal\n- Snack: ~${Math.round(tc*0.10)} kcal\n\nHidratacion: ${Math.round(d.w*0.035)}L/dia`;
    },

    genSupplements(d) {
        return `**Suplementacion** (${d.w}kg)\n\nEsenciales:\n1. Creatina Monohidrato - 5g/dia siempre\n2. Proteina Whey - si no llegas a ${Math.round(d.w*2)}g/dia con comida\n3. Vitamina D3 - 2000-4000 IU/dia\n\nUtiles:\n4. Magnesio glicinato - 400mg antes de dormir\n5. Omega-3 - 2-3g/dia\n6. Cafeina - ${Math.round(d.w*4)}mg pre-entreno\n\nNo sirven: BCAAs, quemadores, boosters de testosterona.\n\nPrioridad real: Sueno > Nutricion > Entreno > Suplementos`;
    },

    genInjury(input, d) {
        let area = 'general';
        if(input.includes('hombro')) area='hombro'; else if(input.includes('rodilla')) area='rodilla';
        else if(input.includes('espalda')||input.includes('lumbar')) area='espalda';
        const info = {hombro:{avoid:'Press detras del cuello, dips profundos',alt:'Mancuernas, landmine press, agarre neutro',rehab:'Face pulls 3x15/dia, rotaciones externas'},rodilla:{avoid:'Sentadillas con rebote, extension pesada',alt:'Box squat, leg press ROM controlado, step-ups',rehab:'Isometricos en pared 3x30s, foam roller'},espalda:{avoid:'Peso muerto con espalda redondeada, crunches',alt:'Bird dog, pallof press, RDL ligero',rehab:'McGill Big 3, cat-cow, glute bridges'},general:{avoid:'Cualquier movimiento que cause dolor agudo',alt:'Busca variaciones sin dolor',rehab:'Movilidad 10min/dia, foam rolling'}};
        const a = info[area];
        return `**${area.charAt(0).toUpperCase()+area.slice(1)}**\n\n*Consulta un profesional si persiste >2 semanas.*\n\nEvita: ${a.avoid}\nAlternativas: ${a.alt}\nRehab: ${a.rehab}\n\nProtocolo vuelta:\n1. Semana 1-2: sin dolor, 40-50% peso\n2. Semana 3-4: gradual a 70%\n3. Semana 5+: normal si no hay dolor`;
    },

    genAssessment(d) {
        const bench = d.prs['bench-press']?d.prs['bench-press'].weight:0;
        const squat = d.prs['squat']?d.prs['squat'].weight:0;
        const dead = d.prs['deadlift']?d.prs['deadlift'].weight:0;
        const exp = d.week*(d.p.daysPerWeek||4);
        const adh = exp>0?Math.round(d.workouts.length/exp*100):0;
        let lvl = 'Principiante'; if(bench/d.w>1.5) lvl='Avanzado'; else if(bench/d.w>1) lvl='Intermedio'; else if(bench/d.w>0.7) lvl='Principiante+';
        let r = `**Valoracion**\n\n${d.w}kg | ${d.h}cm | IMC ${d.bmi}\nGrasa est: ${parseFloat(d.bmi)<22?'10-14':parseFloat(d.bmi)<25?'14-18':parseFloat(d.bmi)<28?'18-24':'24+'}%\n\n`;
        if(bench||squat||dead) r += `Fuerza:\n${bench?'- Bench: '+bench+'kg ('+((bench/d.w).toFixed(1))+'x BW)\n':''}${squat?'- Squat: '+squat+'kg ('+((squat/d.w).toFixed(1))+'x BW)\n':''}${dead?'- Deadlift: '+dead+'kg ('+((dead/d.w).toFixed(1))+'x BW)\n':''}Nivel: **${lvl}**\n\n`;
        r += `Adherencia: ${adh}% (${d.workouts.length} sesiones)\n\n`;
        r += d.p.goal&&d.p.goal.includes('perder')?`Plan: ${Math.round(d.w*26)} kcal, ${Math.round(d.w*2.2)}g prot, cardio 3-4x`:`Plan: ${Math.round(d.w*34)} kcal, ${Math.round(d.w*2)}g prot, progresion +2.5kg/sem`;
        return r;
    },

    genPlateau(d) {
        return `**Romper Estancamiento**\n\nDiagnostico:\n1. Duermes 7-9h?\n2. Comes ${Math.round(d.w*2)}g+ proteina?\n3. Has descansado? (deload cada 4-6 sem)\n4. Llevas tracking de pesos?\n\nSoluciones:\n1. **Deload 1 semana** - 50-60% peso\n2. **Cambia ejercicios** que llevas +6 semanas\n3. **Cambia variables** - 3x10 a 5x5 o 3x15\n4. **Sube volumen** - +2 series por musculo\n5. **Tecnicas de intensidad** - drop sets, rest-pause`;
    },

    genMuscleSession(input, d) {
        const muscles = {pecho:['bench-press','incline-bench','dumbbell-fly','cable-crossover'],espalda:['pull-ups','barbell-row','lat-pulldown','seated-row'],hombro:['ohp','lateral-raise','face-pulls','rear-delt-fly'],pierna:['squat','leg-press','romanian-deadlift','leg-curl'],biceps:['barbell-curl','incline-curl','hammer-curl'],triceps:['close-grip-bench','overhead-extension','tricep-pushdown'],gluteo:['hip-thrust','bulgarian-split','romanian-deadlift'],abdomen:['hanging-leg-raise','cable-crunch','ab-wheel'],core:['hanging-leg-raise','plank','pallof-press']};
        let target = null;
        for(const[k,v] of Object.entries(muscles)){if(input.includes(k)){target={name:k,ids:v};break;}}
        if(!target) target = {name:'pecho',ids:muscles.pecho};
        let r = `**Sesion de ${target.name.charAt(0).toUpperCase()+target.name.slice(1)}** | RPE ${d.pw.rpe}\n\n`;
        target.ids.forEach((id,i)=>{const ex=EXERCISES_DB.find(e=>e.id===id);if(!ex)return;const pr=d.prs[id];r+=`${i+1}. **${ex.name}** - ${ex.sets}x${ex.reps}${pr?' | ~'+Math.round(pr.weight*(d.pw.intensity/100))+'kg':''}${i<2?' (compuesto)':''}\n`;});
        r += `\nProtocolo: primeros 2 compuestos pesados, resto aislamiento con conexion mente-musculo.`;
        return r;
    },


    async analyzeImage(base64) {
        const d = this.getUserData();
        const bf = d.g==='mujer'?(1.2*parseFloat(d.bmi)+0.23*d.a-5.4):(1.2*parseFloat(d.bmi)+0.23*d.a-16.2);
        const est = Math.max(5,Math.min(45,bf)).toFixed(0);
        let state = est<15?'Atletico/definido':est<20?'Buena base, grasa moderada':'Grasa cubriendo musculo';
        let plan = est>18?`Deficit -400kcal (${Math.round(d.tdee-400)} kcal), proteina ${Math.round(d.w*2.2)}g, cardio 10k pasos/dia`:`Superavit +300kcal (${Math.round(d.tdee+300)} kcal), proteina ${Math.round(d.w*2)}g, progresion de cargas`;
        return `**Valoracion**\n\n${d.w}kg | ${d.h}cm | IMC ${d.bmi}\nGrasa estimada: ~${est}%\nEstado: ${state}\n\n**Plan:** ${plan}\n\nTimeline:\n- Semana 3-4: ropa queda diferente\n- Semana 5-8: tu notas el cambio\n- Semana 9-12: los demas notan\n\nFotos cada 2 semanas, misma luz y pose.`;
    },

    genExerciseInfo(input, d) {
        const ex = EXERCISES_DB.find(e => {
            const n = e.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
            return input.includes(n) || input.includes(e.id.replace(/-/g,' '));
        });
        if (ex) {
            const pr = d.prs[ex.id];
            return `**${ex.name}**\n\n${ex.category==='compound'?'Compuesto':'Aislamiento'} | ${ex.muscle} | ${ex.equipment}\n${pr?'PR: '+pr.weight+'kg\n':''}\n${ex.sets}x${ex.reps} | Descanso: ${ex.rest}s\n\n${ex.tips.map(t=>'- '+t).join('\n')}`;
        }
        const muscleMap = {pecho:'Pecho',espalda:'Espalda',hombro:'Hombros',pierna:'Piernas',biceps:'Biceps',triceps:'Triceps'};
        for(const[k,v] of Object.entries(muscleMap)){
            if(input.includes(k)){
                const exs = EXERCISES_DB.filter(e=>e.muscle===v).slice(0,6);
                return `**Mejores para ${v}**\n\n${exs.map((e,i)=>`${i+1}. ${e.name} (${e.category}) - ${e.sets}x${e.reps}`).join('\n')}\n\n2 compuestos + 2-3 aislamientos por sesion. 12-18 series/semana.`;
            }
        }
        return 'Dime que ejercicio o musculo te interesa.';
    },

    genProgram(d, input) {
        const days = d.p.daysPerWeek||4;
        let tKey; if(input.includes('ppl'))tKey='ppl'; else if(input.includes('upper'))tKey='upperLower'; else if(input.includes('full'))tKey='fullBody'; else tKey=days<=3?'fullBody':days===4?'upperLower':days>=5?'ppl':'upperLower';
        const t = ROUTINE_TEMPLATES[tKey];
        let r = `**${t.name}** | ${days} dias/sem | ${d.pw.phase}\n\n`;
        t.days.forEach((day,i) => {
            r += `**Dia ${i+1}: ${day.name}**\n`;
            day.exercises.forEach(id=>{const ex=EXERCISES_DB.find(e=>e.id===id);if(ex)r+=`  - ${ex.name} ${ex.sets}x${ex.reps}\n`;});
            r += '\n';
        });
        r += `Progresion: ${d.pw.deload?'Deload esta semana':'+2.5kg si completaste reps'}`;
        return r;
    },

    genCardio(d) {
        const losing = (d.p.goal||'').includes('perder');
        return `**Cardio**\n\nLISS: ${losing?'4-5':'2-3'}x/sem, 20-40min (caminar, bici)\nHIIT: ${losing?'1-2':'0-1'}x/sem MAX, 15-20min\n\nHack: 10.000 pasos/dia = ~400kcal extra sin afectar recuperacion\n\nErrores:\n- Cardio ANTES de pesas = peor rendimiento\n- HIIT diario = sobreentrenamiento\n- Compensar mala dieta con cardio = no funciona`;
    },

    genRecovery(d) {
        return `**Recuperacion**\n\nSueno: 7-9h, misma hora, cuarto oscuro\nNutricion: ${Math.round(d.w*2)}g proteina, post-entreno whey+carbos\nActiva: caminar 20-30min, foam roller, estiramientos\n\nSuplementos: Magnesio 400mg + Ashwagandha 600mg antes de dormir\n\nSenales de sobreentrenamiento:\n- Rendimiento baja 2+ sesiones\n- Fatiga al despertar\n- Dolor articular\n\nSolucion: 3-5 dias descanso total, comer en mantenimiento.`;
    },

    genMotivation(d) {
        const r = [`La disciplina supera a la motivacion. Los atletas de elite no quieren entrenar todos los dias. La diferencia: van igual.\n\nRegla de 5 min: solo comprometete a calentar. Nadie se ha ido despues de calentar.\n\n${d.workouts.length} sesiones completadas. Cada una es prueba de que puedes.`,`Perspectiva:\n- 1h de gym = 4% de tu dia\n- 4x/semana = 5 horas de 168\n- Tienes el tiempo\n\nDentro de 90 dias vas a existir igual. La pregunta: misma version o la transformada?\n\nNadie se arrepiente despues de entrenar. Nunca.`];
        return r[Math.floor(Math.random()*r.length)];
    },


    genWeight(input, d) {
        const losing = input.includes('bajar')||input.includes('adelgazar')||input.includes('perder');
        if (losing) return `**Bajar de peso**\n\nCome ${Math.round(d.tdee-400)} kcal/dia (-400 bajo TDEE)\nProteina: ${Math.round(d.w*2.2)}g/dia (preservar musculo)\nObjetivo: -0.5 a 1kg/semana\nNO dejes de entrenar pesado.\n\nDespues de dia libre: +1-3kg es AGUA, se va en 2-3 dias.`;
        return `**Subir de peso (musculo)**\n\nCome ${Math.round(d.tdee+300)} kcal/dia (+300 sobre TDEE)\nProteina: ${Math.round(d.w*2)}g/dia\nObjetivo: +0.25-0.5kg/semana\nSi subes mas rapido = mucha grasa.`;
    },

    genComparison(input, d) {
        if (input.includes('barra')&&input.includes('mancuerna')) return `**Barra vs Mancuernas**\n\nBarra: mas carga, progresion facil, rango fijo\nMancuernas: mas rango, trabajo independiente, mas activacion\n\nUsa ambos. Barra para basicos pesados, mancuernas para accesorios.`;
        if (input.includes('volumen')&&input.includes('definicion')||input.includes('bulk')&&input.includes('cut')) return `**Volumen vs Definicion**\n\nVolumen si: <15% grasa, principiante, +6 sem en deficit\nDefinicion si: >18% grasa, +4 meses en volumen\n\nPara ti (IMC ${d.bmi}): ${parseFloat(d.bmi)>25?'Cut 8-12 semanas':parseFloat(d.bmi)<20?'Lean bulk 16-20 semanas':'Recomposicion con alta proteina'}`;
        return `Dime que comparacion necesitas: barra vs mancuernas, volumen vs definicion, maquinas vs peso libre, etc.`;
    },

    genScience(input, d) {
        if (input.includes('series')||input.includes('volumen')) return `**Volumen por musculo (series/semana)**\n\nPecho: 12-18 | Espalda: 14-22 | Hombros: 15-22\nCuadriceps: 12-18 | Isquios: 10-14\nBiceps: 10-14 | Triceps: 8-14\n\nEmpieza bajo, sube 1-2 series/semana hasta no recuperarte.`;
        if (input.includes('rpe')||input.includes('rir')||input.includes('fallo')) return `**RPE/RIR**\n\nRPE 10 = fallo total | RPE 9 = 1 rep en reserva | RPE 8 = 2 reps\n\nTu fase: RPE ${d.pw.rpe}\n\nRegla: 1-3 RIR produce ~90% del estimulo del fallo con mucha menos fatiga.`;
        return `**Principios**\n\n4 pilares: tension mecanica (60-85% 1RM), volumen suficiente, progresion semanal, recovery\n\nPara ti: ${d.p.level==='principiante'?'3':'3-4'} series/ejercicio, 6-12 reps compound, 10-20 aislamiento, RPE ${d.pw.rpe}`;
    },

    genAesthetic(input, d) {
        if (input.includes('six pack')||input.includes('marcar')||input.includes('abdomen')) return `**Abdominales**\n\nSe revelan con dieta (12-15% grasa hombres). Come ${Math.round(d.w*25)} kcal, proteina ${Math.round(d.w*2.2)}g.\n\nEntreno 2-3x/sem:\n- Hanging leg raises 3x10-15\n- Cable crunches 3x12-15\n- Ab wheel 3x8-12\n\nNO hagas oblicuos con peso (ensancha cintura). Cardio 10k pasos.`;
        if (input.includes('brazo')||input.includes('biceps')) return `**Brazos**\n\nTriceps = 2/3 del brazo.\n\nBiceps: curl inclinado 3x10, curl EZ 3x8, martillo 3x10\nTriceps: overhead 3x10, press cerrado 3x8, pushdown 3x12\n\nFrecuencia: 2-3x/sem | 10-14 series directas`;
        return `**Impacto visual (orden):**\n1. Hombros anchos (laterales)\n2. Espalda ancha (dominadas+remos)\n3. Pecho (press inclinado+aperturas)\n4. Brazos (triceps overhead+curls)\n5. Core (deficit calorico)\n\nDime que parte priorizar.`;
    },

    genOneRM(input, d) {
        const m = input.match(/(\d+)\s*(?:kg)?\s*(?:x|por)\s*(\d+)/);
        if(m){const w=parseInt(m[1]),r=parseInt(m[2]),rm=Math.round(w*(36/(37-r)));return `**1RM:** ${w}kg x ${r} = **~${rm}kg**\n\n90%=${Math.round(rm*0.9)}kg (3 reps)\n80%=${Math.round(rm*0.8)}kg (8 reps)\n70%=${Math.round(rm*0.7)}kg (12 reps)`;}
        return `Dime peso x reps para calcular. Ej: "80 x 8"`;
    },

    genSomatotype(d) {
        if(typeof FitnessTools!=='undefined'){const s=FitnessTools.getSomatotype(d.p);if(s)return `**${s.type}**\n\n${s.description}\n\nEntreno: ${s.training.join(', ')}\nNutricion: ${s.nutrition.join(', ')}`;}
        return 'Completa tu perfil para determinar somatotipo.';
    },

    genDefinition(input, d) {
        if(input.includes('rpe')) return `RPE = escala de esfuerzo 1-10. RPE 10 = fallo. RPE 8 = 2 reps en reserva. Tu RPE actual: ${d.pw.rpe}`;
        if(input.includes('deload')) return `Deload = semana al 50-60% peso, mitad de volumen. Recupera fatiga acumulada. Cada 4-6 semanas.`;
        if(input.includes('hipertrofia')) return `Hipertrofia = crecimiento muscular. Necesita: tension mecanica + volumen + progresion + recovery.`;
        if(input.includes('tdee')) return `TDEE = calorias totales que quemas/dia. El tuyo: ~${d.tdee} kcal. Come encima para ganar, debajo para perder.`;
        return `Preguntame que termino quieres que te explique.`;
    },

    genQuantitative(input, d) {
        if(input.includes('proteina')) return `Necesitas **${Math.round(d.w*2)}g proteina/dia**. Distribuida en 4-5 comidas.`;
        if(input.includes('agua')) return `Minimo ${Math.round(d.w*0.035)}L/dia. Dias de entreno +500ml-1L.`;
        if(input.includes('caloria')) return `TDEE: ${d.tdee} kcal. ${(d.p.goal||'').includes('perder')?'Para perder: '+Math.round(d.tdee-400):'Para ganar: '+Math.round(d.tdee+300)} kcal.`;
        return `Dime que quieres calcular: proteina, calorias, agua, peso, etc.`;
    },

    genDefault(prompt, d) {
        return `Sobre "${prompt}":\n\nPuedo responder sobre:\n- Entrenamiento (rutinas, ejercicios, volumen, frecuencia)\n- Nutricion (macros, calorias, comidas, dietas)\n- Suplementacion (creatina, whey, vitaminas)\n- Lesiones y recuperacion\n- Progresion y estancamientos\n- Metas y timelines\n\nEjemplos: "Que entreno hoy?", "Dame mi plan nutricional", "Creame una rutina"`;
    },

    createRoutine() {
        const d = this.getUserData();
        const routine = this.generateCustomRoutine(d.p);
        Storage.saveRoutine(routine);
        return `Rutina "${routine.name}" creada.\n\n${routine.days.length} dias. Ve a Entreno para usarla.`;
    },

    generateCustomRoutine(profile) {
        const days=profile.daysPerWeek||4;
        const tKey=days<=3?'fullBody':days===4?'upperLower':days===5?'bro':'ppl';
        const t=ROUTINE_TEMPLATES[tKey]; const week=Storage.getCurrentWeek();
        const pw=PERIODIZATION.weeks[week-1]||PERIODIZATION.weeks[0];
        return {id:'ai-'+Date.now(),name:t.name+' (IA)',description:'Semana '+week+' - '+pw.phase,template:tKey,days:t.days.map(day=>({name:day.name,exercises:day.exercises.map(id=>{const ex=EXERCISES_DB.find(e=>e.id===id);return ex?{...ex,targetSets:ex.sets,targetReps:ex.reps,intensity:pw.intensity,rpe:pw.rpe}:id;})})),weekCreated:week,phase:pw.phase,createdAt:new Date().toISOString()};
    }
};
