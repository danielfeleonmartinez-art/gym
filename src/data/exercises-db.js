// ===== BASE DE DATOS DE EJERCICIOS =====
const EXERCISES_DB = [
    // === PECHO ===
    { id: 'bench-press', name: 'Press de Banca', muscle: 'Pecho', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🏋️', description: 'Ejercicio fundamental para pecho. Acuéstate en el banco, baja la barra al pecho y empuja.', tips: ['Retrae escápulas', 'Pies firmes en el suelo', 'No rebotes la barra'], sets: 4, reps: '8-12', rest: 90 },
    { id: 'incline-bench', name: 'Press Inclinado', muscle: 'Pecho', category: 'compound', equipment: 'Barra/Mancuernas', difficulty: 'intermedio', icon: '🏋️', description: 'Enfatiza la porción superior del pecho con banco a 30-45 grados.', tips: ['Ángulo de 30-45°', 'No subas demasiado el banco', 'Control en la bajada'], sets: 4, reps: '8-12', rest: 90 },
    { id: 'dumbbell-fly', name: 'Aperturas con Mancuernas', muscle: 'Pecho', category: 'isolation', equipment: 'Mancuernas', difficulty: 'principiante', icon: '🦋', description: 'Aislamiento de pecho con gran estiramiento muscular.', tips: ['Codos ligeramente flexionados', 'Siente el estiramiento', 'No bajes demasiado'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'push-ups', name: 'Flexiones', muscle: 'Pecho', category: 'compound', equipment: 'Peso corporal', difficulty: 'principiante', icon: '💪', description: 'Ejercicio básico de empuje con peso corporal.', tips: ['Cuerpo recto como tabla', 'Codos a 45°', 'Baja hasta el suelo'], sets: 3, reps: '15-20', rest: 60 },
    { id: 'cable-crossover', name: 'Cruce de Cables', muscle: 'Pecho', category: 'isolation', equipment: 'Cables', difficulty: 'intermedio', icon: '🔗', description: 'Excelente para definición y contracción máxima del pecho.', tips: ['Inclínate ligeramente', 'Cruza las manos', 'Squeeze al final'], sets: 3, reps: '12-15', rest: 60 },

    // === ESPALDA ===
    { id: 'pull-ups', name: 'Dominadas', muscle: 'Espalda', category: 'compound', equipment: 'Barra fija', difficulty: 'intermedio', icon: '🧗', description: 'Rey de los ejercicios de espalda. Agarre prono, tira hasta que la barbilla pase la barra.', tips: ['Retrae escápulas primero', 'Baja controlado', 'No uses impulso'], sets: 4, reps: '6-12', rest: 90 },
    { id: 'barbell-row', name: 'Remo con Barra', muscle: 'Espalda', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🚣', description: 'Movimiento de tracción horizontal para espalda gruesa.', tips: ['Espalda recta 45°', 'Tira hacia el ombligo', 'Aprieta escápulas'], sets: 4, reps: '8-12', rest: 90 },
    { id: 'lat-pulldown', name: 'Jalón al Pecho', muscle: 'Espalda', category: 'compound', equipment: 'Máquina', difficulty: 'principiante', icon: '⬇️', description: 'Alternativa a dominadas, ideal para desarrollar dorsales.', tips: ['Inclina torso ligeramente', 'Tira con codos', 'No te balancees'], sets: 4, reps: '10-12', rest: 75 },
    { id: 'seated-row', name: 'Remo Sentado', muscle: 'Espalda', category: 'compound', equipment: 'Máquina/Cable', difficulty: 'principiante', icon: '🚣', description: 'Remo sentado para grosor de espalda media.', tips: ['Pecho contra el pad', 'Aprieta al final', 'No uses momentum'], sets: 3, reps: '10-12', rest: 75 },
    { id: 'face-pulls', name: 'Face Pulls', muscle: 'Espalda', category: 'isolation', equipment: 'Cable', difficulty: 'principiante', icon: '🎯', description: 'Excelente para deltoides posteriores y salud del hombro.', tips: ['Cuerda a nivel de cara', 'Rotación externa', 'Squeeze al final'], sets: 3, reps: '15-20', rest: 60 },
    { id: 'deadlift', name: 'Peso Muerto', muscle: 'Espalda', category: 'compound', equipment: 'Barra', difficulty: 'avanzado', icon: '🏋️', description: 'Ejercicio rey para toda la cadena posterior.', tips: ['Espalda neutra SIEMPRE', 'Barra pegada al cuerpo', 'Empuja el suelo'], sets: 4, reps: '5-8', rest: 180 },

    // === HOMBROS ===
    { id: 'ohp', name: 'Press Militar', muscle: 'Hombros', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🏋️', description: 'Press por encima de la cabeza para deltoides anteriores.', tips: ['Core apretado', 'No arquees la espalda', 'Bloquea arriba'], sets: 4, reps: '8-10', rest: 90 },
    { id: 'lateral-raise', name: 'Elevaciones Laterales', muscle: 'Hombros', category: 'isolation', equipment: 'Mancuernas', difficulty: 'principiante', icon: '🦅', description: 'Aislamiento de deltoides lateral para hombros anchos.', tips: ['Codos ligeramente flexionados', 'No subas más de 90°', 'Controla la bajada'], sets: 4, reps: '12-15', rest: 60 },
    { id: 'front-raise', name: 'Elevaciones Frontales', muscle: 'Hombros', category: 'isolation', equipment: 'Mancuernas', difficulty: 'principiante', icon: '🙋', description: 'Trabajo de deltoides anterior.', tips: ['Alterna brazos', 'No uses impulso', 'Sube hasta paralelo'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'rear-delt-fly', name: 'Pájaros', muscle: 'Hombros', category: 'isolation', equipment: 'Mancuernas', difficulty: 'principiante', icon: '🦅', description: 'Deltoides posterior para hombros 3D.', tips: ['Inclínate 90°', 'Codos arriba', 'Peso ligero'], sets: 3, reps: '15-20', rest: 60 },
    // === PIERNAS ===
    { id: 'squat', name: 'Sentadilla', muscle: 'Piernas', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🦵', description: 'Ejercicio fundamental para piernas. Baja hasta paralelo o más.', tips: ['Rodillas en dirección de pies', 'Profundidad mínima paralelo', 'Core activado'], sets: 4, reps: '6-10', rest: 120 },
    { id: 'leg-press', name: 'Prensa de Piernas', muscle: 'Piernas', category: 'compound', equipment: 'Máquina', difficulty: 'principiante', icon: '🦿', description: 'Gran ejercicio para cuádriceps sin carga axial.', tips: ['No bloquees rodillas', 'Baja a 90°', 'Pies a ancho de hombros'], sets: 4, reps: '10-12', rest: 90 },
    { id: 'romanian-deadlift', name: 'Peso Muerto Rumano', muscle: 'Piernas', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🏋️', description: 'Excelente para isquiotibiales y glúteos.', tips: ['Rodillas semi-flexionadas', 'Bisagra de cadera', 'Siente el estiramiento'], sets: 4, reps: '8-12', rest: 90 },
    { id: 'leg-curl', name: 'Curl de Piernas', muscle: 'Piernas', category: 'isolation', equipment: 'Máquina', difficulty: 'principiante', icon: '🦵', description: 'Aislamiento de isquiotibiales.', tips: ['No levantes la cadera', 'Squeeze arriba', 'Baja controlado'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'leg-extension', name: 'Extensión de Piernas', muscle: 'Piernas', category: 'isolation', equipment: 'Máquina', difficulty: 'principiante', icon: '🦵', description: 'Aislamiento de cuádriceps.', tips: ['Extiende completamente', 'Squeeze arriba 2s', 'No uses impulso'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'calf-raise', name: 'Elevación de Gemelos', muscle: 'Piernas', category: 'isolation', equipment: 'Máquina/Peso corporal', difficulty: 'principiante', icon: '🦶', description: 'Trabajo de pantorrillas con rango completo.', tips: ['Rango completo', 'Pausa arriba 2s', 'Estira abajo'], sets: 4, reps: '15-20', rest: 45 },
    { id: 'bulgarian-split', name: 'Sentadilla Búlgara', muscle: 'Piernas', category: 'compound', equipment: 'Mancuernas', difficulty: 'intermedio', icon: '🦵', description: 'Unilateral excelente para glúteos y cuádriceps.', tips: ['Pie trasero en banco', 'Rodilla no pase el pie', 'Torso erguido'], sets: 3, reps: '10-12', rest: 75 },

    // === BÍCEPS ===
    { id: 'barbell-curl', name: 'Curl con Barra', muscle: 'Bíceps', category: 'isolation', equipment: 'Barra', difficulty: 'principiante', icon: '💪', description: 'Ejercicio clásico para bíceps con barra recta o Z.', tips: ['Codos pegados al cuerpo', 'No balancees', 'Baja controlado'], sets: 3, reps: '10-12', rest: 60 },
    { id: 'hammer-curl', name: 'Curl Martillo', muscle: 'Bíceps', category: 'isolation', equipment: 'Mancuernas', difficulty: 'principiante', icon: '🔨', description: 'Trabaja bíceps y braquial para brazos gruesos.', tips: ['Agarre neutro', 'No gires la muñeca', 'Contrae arriba'], sets: 3, reps: '10-12', rest: 60 },
    { id: 'incline-curl', name: 'Curl Inclinado', muscle: 'Bíceps', category: 'isolation', equipment: 'Mancuernas', difficulty: 'intermedio', icon: '💪', description: 'Máximo estiramiento del bíceps en banco inclinado.', tips: ['Banco a 45°', 'Brazos colgando', 'No subas el codo'], sets: 3, reps: '10-12', rest: 60 },
    { id: 'preacher-curl', name: 'Curl Predicador', muscle: 'Bíceps', category: 'isolation', equipment: 'Barra/Mancuerna', difficulty: 'principiante', icon: '💪', description: 'Aislamiento puro de bíceps sin momentum.', tips: ['Brazos bien apoyados', 'No extiendas del todo', 'Squeeze arriba'], sets: 3, reps: '10-12', rest: 60 },
    // === TRÍCEPS ===
    { id: 'close-grip-bench', name: 'Press Agarre Cerrado', muscle: 'Tríceps', category: 'compound', equipment: 'Barra', difficulty: 'intermedio', icon: '🏋️', description: 'Compound para tríceps con press de banca agarre cerrado.', tips: ['Manos a ancho de hombros', 'Codos pegados', 'Bloquea arriba'], sets: 4, reps: '8-12', rest: 90 },
    { id: 'tricep-pushdown', name: 'Extensión en Polea', muscle: 'Tríceps', category: 'isolation', equipment: 'Cable', difficulty: 'principiante', icon: '⬇️', description: 'Aislamiento clásico de tríceps en polea alta.', tips: ['Codos fijos', 'Extiende completamente', 'No uses el cuerpo'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'overhead-extension', name: 'Extensión Overhead', muscle: 'Tríceps', category: 'isolation', equipment: 'Mancuerna/Cable', difficulty: 'principiante', icon: '🙆', description: 'Estiramiento de cabeza larga del tríceps.', tips: ['Codos apuntando arriba', 'Baja detrás de la cabeza', 'Core apretado'], sets: 3, reps: '12-15', rest: 60 },
    { id: 'dips', name: 'Fondos', muscle: 'Tríceps', category: 'compound', equipment: 'Paralelas', difficulty: 'intermedio', icon: '🤸', description: 'Compound para tríceps y pecho inferior.', tips: ['Cuerpo vertical = tríceps', 'Baja a 90°', 'No te balancees'], sets: 3, reps: '8-12', rest: 75 },
    // === CORE ===
    { id: 'plank', name: 'Plancha', muscle: 'Core', category: 'isolation', equipment: 'Peso corporal', difficulty: 'principiante', icon: '🧘', description: 'Isométrico fundamental para estabilidad del core.', tips: ['Cuerpo recto', 'Aprieta glúteos', 'No hundas cadera'], sets: 3, reps: '30-60s', rest: 45 },
    { id: 'hanging-leg-raise', name: 'Elevación de Piernas Colgado', muscle: 'Core', category: 'compound', equipment: 'Barra fija', difficulty: 'avanzado', icon: '🦵', description: 'Ejercicio avanzado para abdominales inferiores.', tips: ['Sin balanceo', 'Sube hasta 90°', 'Baja controlado'], sets: 3, reps: '10-15', rest: 60 },
    { id: 'cable-crunch', name: 'Crunch en Polea', muscle: 'Core', category: 'isolation', equipment: 'Cable', difficulty: 'intermedio', icon: '🔥', description: 'Abdominales con resistencia progresiva.', tips: ['Flexiona columna', 'No tires con brazos', 'Squeeze abajo'], sets: 3, reps: '15-20', rest: 45 },
    { id: 'russian-twist', name: 'Giro Ruso', muscle: 'Core', category: 'isolation', equipment: 'Mancuerna/Disco', difficulty: 'principiante', icon: '🔄', description: 'Trabajo de oblicuos y rotación.', tips: ['Pies elevados', 'Rota desde el torso', 'Toca el suelo cada lado'], sets: 3, reps: '20-30', rest: 45 },
];


// ===== PLANTILLAS DE RUTINAS EFECTIVAS (Periodización 12-16 semanas) =====
const ROUTINE_TEMPLATES = {
    ppl: {
        name: 'Push/Pull/Legs (PPL)',
        description: 'División clásica de 6 días para máxima hipertrofia',
        frequency: 6,
        level: 'intermedio',
        duration: '60-75 min',
        days: [
            { name: 'Push A (Pecho énfasis)', exercises: ['bench-press', 'incline-bench', 'dumbbell-fly', 'ohp', 'lateral-raise', 'tricep-pushdown', 'overhead-extension'] },
            { name: 'Pull A (Espalda énfasis)', exercises: ['deadlift', 'pull-ups', 'barbell-row', 'face-pulls', 'barbell-curl', 'hammer-curl'] },
            { name: 'Legs A (Cuádriceps énfasis)', exercises: ['squat', 'leg-press', 'leg-extension', 'romanian-deadlift', 'leg-curl', 'calf-raise'] },
            { name: 'Push B (Hombros énfasis)', exercises: ['ohp', 'incline-bench', 'cable-crossover', 'lateral-raise', 'front-raise', 'close-grip-bench', 'dips'] },
            { name: 'Pull B (Ancho énfasis)', exercises: ['pull-ups', 'lat-pulldown', 'seated-row', 'face-pulls', 'rear-delt-fly', 'incline-curl', 'preacher-curl'] },
            { name: 'Legs B (Posterior énfasis)', exercises: ['romanian-deadlift', 'bulgarian-split', 'leg-curl', 'leg-press', 'leg-extension', 'calf-raise', 'hanging-leg-raise'] }
        ]
    },
    upperLower: {
        name: 'Upper/Lower',
        description: 'División de 4 días, ideal para intermedios con menos tiempo',
        frequency: 4,
        level: 'intermedio',
        duration: '60-70 min',
        days: [
            { name: 'Upper A (Fuerza)', exercises: ['bench-press', 'barbell-row', 'ohp', 'pull-ups', 'barbell-curl', 'tricep-pushdown'] },
            { name: 'Lower A (Fuerza)', exercises: ['squat', 'romanian-deadlift', 'leg-press', 'leg-curl', 'calf-raise', 'plank'] },
            { name: 'Upper B (Hipertrofia)', exercises: ['incline-bench', 'lat-pulldown', 'lateral-raise', 'cable-crossover', 'hammer-curl', 'overhead-extension'] },
            { name: 'Lower B (Hipertrofia)', exercises: ['bulgarian-split', 'leg-extension', 'leg-curl', 'deadlift', 'calf-raise', 'hanging-leg-raise'] }
        ]
    },
    fullBody: {
        name: 'Full Body',
        description: 'Ideal para principiantes, 3 días con descanso entre sesiones',
        frequency: 3,
        level: 'principiante',
        duration: '50-60 min',
        days: [
            { name: 'Full Body A', exercises: ['squat', 'bench-press', 'barbell-row', 'lateral-raise', 'barbell-curl', 'plank'] },
            { name: 'Full Body B', exercises: ['deadlift', 'ohp', 'lat-pulldown', 'leg-press', 'hammer-curl', 'russian-twist'] },
            { name: 'Full Body C', exercises: ['bulgarian-split', 'incline-bench', 'pull-ups', 'leg-curl', 'dips', 'hanging-leg-raise'] }
        ]
    },
    bro: {
        name: 'Bro Split (1 músculo/día)',
        description: 'División de 5 días, un grupo muscular por sesión',
        frequency: 5,
        level: 'avanzado',
        duration: '60-75 min',
        days: [
            { name: 'Pecho', exercises: ['bench-press', 'incline-bench', 'dumbbell-fly', 'cable-crossover', 'push-ups'] },
            { name: 'Espalda', exercises: ['deadlift', 'pull-ups', 'barbell-row', 'lat-pulldown', 'seated-row', 'face-pulls'] },
            { name: 'Hombros', exercises: ['ohp', 'lateral-raise', 'front-raise', 'rear-delt-fly', 'face-pulls'] },
            { name: 'Piernas', exercises: ['squat', 'leg-press', 'romanian-deadlift', 'leg-extension', 'leg-curl', 'calf-raise', 'bulgarian-split'] },
            { name: 'Brazos', exercises: ['barbell-curl', 'hammer-curl', 'preacher-curl', 'close-grip-bench', 'tricep-pushdown', 'overhead-extension', 'dips'] }
        ]
    }
};

// ===== PROGRAMA DE PERIODIZACIÓN (12 semanas) =====
const PERIODIZATION = {
    weeks: [
        { week: 1, phase: 'Adaptación', intensity: 60, volume: 'moderado', rpe: '6-7', deload: false },
        { week: 2, phase: 'Adaptación', intensity: 65, volume: 'moderado', rpe: '7', deload: false },
        { week: 3, phase: 'Acumulación', intensity: 70, volume: 'alto', rpe: '7-8', deload: false },
        { week: 4, phase: 'Acumulación', intensity: 72, volume: 'alto', rpe: '8', deload: false },
        { week: 5, phase: 'Deload', intensity: 55, volume: 'bajo', rpe: '5-6', deload: true },
        { week: 6, phase: 'Intensificación', intensity: 75, volume: 'moderado-alto', rpe: '8', deload: false },
        { week: 7, phase: 'Intensificación', intensity: 78, volume: 'moderado-alto', rpe: '8-9', deload: false },
        { week: 8, phase: 'Intensificación', intensity: 80, volume: 'moderado', rpe: '9', deload: false },
        { week: 9, phase: 'Deload', intensity: 55, volume: 'bajo', rpe: '5-6', deload: true },
        { week: 10, phase: 'Pico', intensity: 85, volume: 'moderado', rpe: '9', deload: false },
        { week: 11, phase: 'Pico', intensity: 88, volume: 'moderado-bajo', rpe: '9-10', deload: false },
        { week: 12, phase: 'Test/PR', intensity: 90, volume: 'bajo', rpe: '10', deload: false },
    ],
    guidelines: {
        progression: 'Aumenta peso 2.5-5kg en compound, 1-2.5kg en isolation cada semana (si completas todas las reps)',
        deload: 'Reduce peso al 60% y volumen al 50%. Sigue yendo al gym pero ligero.',
        failure: 'Entrena a 1-2 reps del fallo (RIR). Solo llega al fallo en la última serie.',
        rest: 'Compound: 2-3 min. Isolation: 60-90s. Supersets: 30-45s.'
    }
};
