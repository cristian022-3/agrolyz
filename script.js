/* ==========================================
   AGROLYZ - Script.js CORREGIDO
   Lógica de cámara y análisis con TensorFlow.js
   ========================================== */

// Variables globales
let model = null;
let webcamStream = null;
let capturedImageData = null;
let allClassNames = [];

// Recomendaciones por enfermedad (español)
const recommendations = {
    'Corn___Common_rust': {
        name: '🔴 Roya del Maíz',
        symptoms: 'Pústulas anaranjadas/rojas en la hoja',
        treatment: [
            'Aplicar fungicidas a base de azufre o triazoles',
            'Eliminar malezas hospedantes',
            'Mejorar ventilación removiendo malezas',
            'Usar variedades resistentes en próximas cosechas',
            'Evitar riego por aspersión en horas de calor'
        ]
    },
    'Corn___Gray_leaf_spot': {
        name: '⚫ Tizón Gris',
        symptoms: 'Manchas rectangulares gris-marrones con bordes oscuros',
        treatment: [
            'Usar fungicidas sistémicos (azoxistrobina, propiconazol)',
            'Realizar rotación de cultivos (mínimo 2 años)',
            'Eliminar residuos de cosechas anteriores',
            'Mantener humedad moderada del suelo',
            'Espaciar adecuadamente las plantas para mejor ventilación'
        ]
    },
    'Corn___healthy': {
        name: '✅ Hoja Sana',
        symptoms: 'Sin síntomas visibles de enfermedad',
        treatment: [
            'Continúa con el monitoreo regular',
            'Mantén prácticas de manejo agronómico adecuadas',
            'Sigue aplicando medidas preventivas',
            'Monitorea semanalmente las plantas',
            'Reporta cualquier síntoma nuevo inmediatamente'
        ]
    }
};

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Agrolyz iniciando...');
    await initializeApp();
});

async function initializeApp() {
    try {
        // Cargar modelo
        await loadModel();
        
        // Acceder a cámara
        await startWebcam();
        
        // Configurar eventos
        setupEventListeners();
        
        // Mostrar app
        document.getElementById('loading').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        
        console.log('✅ Agrolyz listo');
    } catch (error) {
        console.error('Error en inicialización:', error);
        showError('No se pudo inicializar la aplicación: ' + error.message);
    }
}

// ==================== CARGAR MODELO ====================
// ==================== CARGAR MODELO ====================
async function loadModel() {
    // Usamos SIEMPRE la ruta relativa. Funciona en local y en GitHub Pages.
    const modelPath = './models/model.json';
    
    console.log('Intentando cargar modelo desde:', modelPath);
    
    try {
        model = await tf.loadLayersModel(modelPath);
        console.log('✅ Modelo cargado exitosamente');
        
        // Obtener nombres de clases
        await getClassNames();
        
    } catch (error) {
        console.error('Error al cargar modelo:', error);
        throw new Error('No se pudo cargar el modelo desde ' + modelPath + '. Si estás en tu PC local, recuerda usar Live Server.');
    }
}

async function getClassNames() {
    // Nombres de clases del dataset
    const predefinedClasses = [
        'Apple___Apple_scab', 'Apple___Black_rot', 'Apple___Cedar_apple_rust', 'Apple___healthy',
        'Blueberry___healthy',
        'Cherry_(including_sour)___Powdery_mildew', 'Cherry_(including_sour)___healthy',
        'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot', 'Corn_(maize)___Common_rust_', 'Corn_(maize)___Northern_Leaf_Blight', 'Corn_(maize)___healthy',
        'Grape___Black_rot', 'Grape___Esca_(Black_Measles)', 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)', 'Grape___healthy',
        'Orange___Haunglongbing_(Citrus_greening)',
        'Peach___Bacterial_spot', 'Peach___healthy',
        'Pepper,_bell___Bacterial_spot', 'Pepper,_bell___healthy',
        'Potato___Early_blight', 'Potato___Late_blight', 'Potato___healthy',
        'Raspberry___healthy',
        'Soybean___healthy',
        'Squash___Powdery_mildew',
        'Strawberry___Leaf_scorch', 'Strawberry___healthy',
        'Tomato___Bacterial_spot', 'Tomato___Early_blight', 'Tomato___Late_blight', 'Tomato___Leaf_Mold', 'Tomato___Septoria_leaf_spot', 'Tomato___Spider_mites Two-spotted_spider_mite', 'Tomato___Target_Spot', 'Tomato___Tomato_Yellow_Leaf_Curl_Virus', 'Tomato___Tomato_mosaic_virus', 'Tomato___healthy'
    ];
    
    allClassNames = predefinedClasses;
    console.log('Clases cargadas:', allClassNames.length);
}

// ==================== ACCESO A CÁMARA ====================
async function startWebcam() {
    try {
        console.log('Solicitando acceso a cámara...');
        
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        
        webcamStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        const videoElement = document.getElementById('webcam');
        videoElement.srcObject = webcamStream;
        
        console.log('✅ Cámara iniciada');
        
    } catch (error) {
        console.error('Error acceso a cámara:', error);
        throw new Error('No se pudo acceder a la cámara. Verifica los permisos.');
    }
}

// ==================== CONFIGURAR EVENTOS ====================
function setupEventListeners() {
    document.getElementById('capture-btn').addEventListener('click', captureImage);
    document.getElementById('analyze-btn').addEventListener('click', analyzeImage);
    document.getElementById('reset-btn').addEventListener('click', resetApp);
}

// ==================== CAPTURAR IMAGEN ====================
function captureImage() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Guardar imagen para preview
    capturedImageData = canvas.toDataURL('image/jpeg');
    
    // Mostrar preview
    document.getElementById('preview-image').src = capturedImageData;
    
    // Activar botón de análisis
    document.getElementById('analyze-btn').disabled = false;
    document.getElementById('analyze-btn').style.display = 'block';
    document.getElementById('reset-btn').style.display = 'block';
    
    console.log('Imagen capturada');
}

// ==================== ANALIZAR IMAGEN ====================
async function analyzeImage() {
    if (!capturedImageData || !model) {
        alert('Por favor captura una imagen primero');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        document.getElementById('analyze-btn').disabled = true;
        document.getElementById('analyze-btn').textContent = '⏳ Analizando...';
        
        // Cargar imagen desde canvas
        const canvas = document.getElementById('canvas');
        
        // Pre-procesar imagen
        let imageTensor = tf.browser.fromPixels(canvas);
        
        // Redimensionar a 224x224 (como se entrenó el modelo)
        imageTensor = tf.image.resizeBilinear(imageTensor, [224, 224]);
        
        // Normalizar (0-1)
        imageTensor = imageTensor.div(tf.scalar(255));
        
        // Agregar dimensión de batch
        const batchTensor = imageTensor.expandDims(0);
        
        // Realizar predicción
        const prediction = await model.predict(batchTensor);
        const predictionsData = await prediction.data();
        
        // Convertir a array
        const predictions = Array.from(predictionsData);
        
        // Limpiar tensores
        imageTensor.dispose();
        batchTensor.dispose();
        prediction.dispose();
        
        // Encontrar clase con mayor probabilidad
        let maxProbability = 0;
        let maxClassIndex = 0;
        
        for (let i = 0; i < predictions.length; i++) {
            if (predictions[i] > maxProbability) {
                maxProbability = predictions[i];
                maxClassIndex = i;
            }
        }
        
        // Obtener nombre de clase
        const predictedClass = allClassNames[maxClassIndex];
        
        // Mostrar resultados
        displayResults(predictedClass, maxProbability, predictions);
        
    } catch (error) {
        console.error('Error en análisis:', error);
        alert('Error al analizar la imagen: ' + error.message);
        
    } finally {
        document.getElementById('analyze-btn').disabled = false;
        document.getElementById('analyze-btn').textContent = '🔍 Analizar Imagen';
    }
}

// ==================== MOSTRAR RESULTADOS ====================
function displayResults(className, confidence, allPredictions) {
    // Determinar si es enfermedad del maíz
    let displayClass = 'Corn___healthy';
    let isCorndisease = false;
    
    if (className && (
        className.includes('Corn') || 
        className.includes('maize')
    )) {
        isCorndisease = true;
        
        if (className.includes('rust') || className.includes('Common_rust')) {
            displayClass = 'Corn___Common_rust';
        } else if (className.includes('Gray_leaf_spot') || className.includes('Cercospora')) {
            displayClass = 'Corn___Gray_leaf_spot';
        }
    }
    
    // Obtener información
    const info = recommendations[displayClass];
    
    // Actualizar diagnóstico
    document.getElementById('diagnosis-title').textContent = info.name;
    document.getElementById('diagnosis-disease').textContent = info.name;
    document.getElementById('diagnosis-confidence').textContent = 
        `Confianza: ${(confidence * 100).toFixed(1)}%`;
    
    // Actualizar color según diagnóstico
    const diagnosisBox = document.getElementById('diagnosis-box');
    if (displayClass === 'Corn___healthy') {
        diagnosisBox.style.borderLeftColor = '#2ecc71';
    } else if (displayClass === 'Corn___Common_rust') {
        diagnosisBox.style.borderLeftColor = '#e74c3c';
    } else {
        diagnosisBox.style.borderLeftColor = '#f39c12';
    }
    
    // Actualizar recomendaciones
    const recommendationsText = info.treatment.join(' • ');
    document.getElementById('recommendations-text').textContent = recommendationsText;
    
    // Crear gráfico de confianza para clases principales del maíz
    displayConfidenceChart(allPredictions);
    
    // Mostrar resultados
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    
    console.log('Diagnóstico:', displayClass);
    console.log('Confianza:', confidence);
}

// ==================== GRÁFICO DE CONFIANZA ====================
function displayConfidenceChart(predictions) {
    const chartContainer = document.getElementById('confidence-bars');
    chartContainer.innerHTML = '';
    
    // Clases del maíz que queremos mostrar
    const cornClasses = [
        { idx: 9, name: 'Roya' },      // Common_rust
        { idx: 8, name: 'Tizón Gris' }, // Gray_leaf_spot
        { idx: 11, name: 'Sano' }       // healthy
    ];
    
    cornClasses.forEach(corn => {
        if (corn.idx < predictions.length) {
            const confidence = predictions[corn.idx];
            const percentage = (confidence * 100).toFixed(1);
            
            const barItem = document.createElement('div');
            barItem.className = 'bar-item';
            
            barItem.innerHTML = `
                <div class="bar-label">
                    <span>${corn.name}</span>
                    <span class="bar-value">${percentage}%</span>
                </div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%">
                        ${percentage > 15 ? percentage + '%' : ''}
                    </div>
                </div>
            `;
            
            chartContainer.appendChild(barItem);
        }
    });
}

// ==================== RESET ====================
function resetApp() {
    // Limpiar canvas
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Limpiar variables
    capturedImageData = null;
    
    // Ocultar resultados
    document.getElementById('results').style.display = 'none';
    document.getElementById('preview-image').src = '';
    
    // Resetear botones
    document.getElementById('analyze-btn').disabled = true;
    document.getElementById('reset-btn').style.display = 'none';
    
    // Volver al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('Aplicación reseteada');
}

// ==================== MANEJO DE ERRORES ====================
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

// ==================== LIMPIAR RECURSOS ====================
window.addEventListener('beforeunload', () => {
    if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
    }
});

console.log('Script cargado correctamente');