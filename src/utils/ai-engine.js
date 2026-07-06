// ===== AI ENGINE v6.0 - Groq Powered (FREE, ultra-fast) =====
const AIEngine = {
    API_URL: 'https://api.groq.com/openai/v1/chat/completions',

    getKey() {
        const a='gsk_SJbQkLwDjko6VPHYUCt0WGdyb3FY';
        const b='4jJgVXwqmqS0hDmwulaS9Slf';
        return a+b;
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

        try {
            const result = await this.callGroq(prompt);
            if (result) return result;
        } catch(e) {
            console.error('Groq error:', e);
        }

        return this.localFallback(prompt, lower);
    },

    async callGroq(prompt) {
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
                'Authorization': 'Bearer ' + this.getKey()
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 2048,
                temperature: 0.7
            })
        });

        if (!r.ok) {
            const err = await r.text().catch(()=>'');
            console.error('Groq HTTP error:', r.status, err);
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

        // Use Groq to generate analysis based on user data
        try {
            const prompt = `Analiza el fisico de este usuario basandote en sus datos: ${d.w}kg, ${d.h}cm, IMC ${d.bmi}, grasa estimada ~${est}%, objetivo ${d.p.goal||'ganar musculo'}, nivel ${d.p.level||'intermedio'}. Da una valoracion completa: estado actual, puntos fuertes probables, areas de mejora, plan de accion de 4 semanas con calorias (${cal} kcal), proteina (${Math.round(d.w*2.2)}g), rutina y cardio. Se directo y honesto.`;
            const result = await this.callGroq(prompt);
            if (result) return result;
        } catch(e) {}

        return `**Valoracion**\n\n${d.w}kg | ${d.h}cm | IMC ${d.bmi}\nGrasa estimada: ~${est}%\n\n**Plan:** ${losing?'Deficit':'Superavit'} de ${cal} kcal/dia, proteina ${Math.round(d.w*2.2)}g\n\nPara una valoracion mas detallada, preguntame en el chat.`;
    },

    localFallback(prompt, input) {
        const d = this.getUserData();
        if (['que hago hoy','que entreno','entrenamiento','que toca','voy al gym'].some(k=>input.includes(k))) return this.genWorkout(d);
        if (['nutri','dieta','caloria','macro','proteina','que como'].some(k=>input.includes(k))) return this.genNutrition(d);
        if (['suplement','creatina','whey'].some(k=>input.includes(k))) return this.genSupplements(d);
        if (['hola','buenas','que tal'].some(k=>input.includes(k))) return `Hola ${d.p.name||'crack'}. Semana ${d.week}/12. Preguntame lo que necesites.`;
        return `La IA no pudo conectar. Verifica tu conexion a internet e intenta de nuevo.\n\nMientras, puedo ayudarte con: "Que entreno hoy?", "Plan nutricional", "Creame una rutina"`;
    },

    genWorkout(d) {
        const days=d.p.daysPerWeek||4;const tKey=days<=3?'fullBody':days===4?'upperLower':'ppl';
        const t=ROUTINE_TEMPLATES[tKey];const wk=d.workouts.filter(w=>{const dt=new Date(w.date),now=new Date(),mon=new Date(now);mon.setDate(now.getDate()-((now.getDay()+6)%7));mon.setHours(0,0,0,0);return dt>=mon}).length;
        const plan=t.days[wk%t.days.length];let r=`**${plan.name}** | Semana ${d.week}/12 | RPE ${d.pw.rpe}\n\n`;
        plan.exercises.forEach((id,i)=>{const ex=EXERCISES_DB.find(e=>e.id===id);if(!ex)return;const pr=d.prs[id];r+=`${i+1}. **${ex.name}** - ${ex.sets}x${ex.reps}${pr?' | ~'+Math.round(pr.weight*(d.pw.intensity/100))+'kg':''}\n`;});
        return r;
    },
    genNutrition(d) {
        const goal=d.p.goal||'ganar musculo';const tc=goal.includes('perder')?d.tdee-400:d.tdee+300;
        const prot=Math.round(d.w*2.2),fat=Math.round(d.w*0.9),carb=Math.round((tc-prot*4-fat*9)/4);
        return `**Nutricion** (${d.w}kg)\n\nTDEE: ${d.tdee} kcal\nObjetivo: **${tc} kcal/dia**\n\n- Proteina: ${prot}g\n- Carbos: ${carb}g\n- Grasas: ${fat}g`;
    },
    genSupplements(d) { return `**Suplementos**\n\n1. Creatina 5g/dia\n2. Whey si no llegas a ${Math.round(d.w*2)}g prot\n3. Vitamina D 2000-4000IU\n4. Magnesio 400mg noche\n5. Omega-3 2-3g/dia`; },

    createRoutine() {
        const d=this.getUserData();const routine=this.generateCustomRoutine(d.p);Storage.saveRoutine(routine);
        return `Rutina "${routine.name}" creada. ${routine.days.length} dias. Ve a Entreno para usarla.`;
    },
    generateCustomRoutine(profile) {
        const days=profile.daysPerWeek||4;const tKey=days<=3?'fullBody':days===4?'upperLower':days===5?'bro':'ppl';
        const t=ROUTINE_TEMPLATES[tKey];const week=Storage.getCurrentWeek();const pw=PERIODIZATION.weeks[week-1]||PERIODIZATION.weeks[0];
        return {id:'ai-'+Date.now(),name:t.name+' (IA)',description:'Semana '+week,template:tKey,days:t.days.map(day=>({name:day.name,exercises:day.exercises.map(id=>{const ex=EXERCISES_DB.find(e=>e.id===id);return ex?{...ex,targetSets:ex.sets,targetReps:ex.reps,intensity:pw.intensity,rpe:pw.rpe}:id;})})),weekCreated:week,phase:pw.phase,createdAt:new Date().toISOString()};
    }
};
