// libs/gemini.js (VERSIÓN COMMONJS - OPTIMIZADA PARA VELOCIDAD)

const { GoogleGenerativeAI } = require("@google/generative-ai");
const chalk = require('chalk');

// Leemos tu clave de API desde el archivo .env
const GEMINI_API_KEY = process.env.GOOGLE_API_KEY;
let genAI, model;

// --- FUNCIÓN DE AUTO-DIAGNÓSTICO ---
async function verifyConnection() {
    console.log(chalk.blue('Verificando la conexión con la API de Google Gemini...'));
    try {
        const result = await model.generateContent("test");
        await result.response;
        console.log(chalk.green('✅ Conexión con la API de Gemini exitosa. El modelo está listo.'));
    } catch (error) {
        console.error(chalk.red('--------------------------------------------------'));
        if (error.message.includes('API key not valid')) {
            console.error(chalk.red('❌ ERROR: Tu GOOGLE_API_KEY es inválida o ha expirado.'));
            console.error(chalk.yellow('   Por favor, verifica la clave en tu archivo .env y en https://aistudio.google.com/app/apikey'));
        } else if (error.message.includes('404')) {
            console.error(chalk.red('❌ ERROR: El modelo "gemini-1.5-flash-latest" no fue encontrado.'));
            console.error(chalk.yellow('   Esto puede ser un problema temporal de Google o el nombre del modelo ha cambiado.'));
        } else {
            console.error(chalk.red('❌ ERROR: No se pudo conectar con la API de Gemini.'), error.message);
        }
        console.error(chalk.red('--------------------------------------------------'));
    }
}

// Verificamos si la clave existe antes de inicializar
if (!GEMINI_API_KEY) {
    console.warn(chalk.yellow("Advertencia: GOOGLE_API_KEY no está configurada. Los comandos de IA no funcionarán."));
} else {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // =================================================================
        // OPTIMIZACIÓN: Se cambia al modelo "flash" para respuestas más rápidas.
        // =================================================================
        model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        verifyConnection();
    } catch (e) {
        console.error(chalk.red("Error al inicializar GoogleGenerativeAI. Verifica tu API key."), e);
    }
}

/**
 * Realiza una consulta a la API de Gemini.
 * @param {string} prompt - La pregunta o texto a procesar.
 * @returns {Promise<string>} La respuesta generada por la IA.
 */
async function askGemini(prompt) {
    if (!GEMINI_API_KEY || !model) {
        return "Lo siento, la función de IA no está configurada correctamente por el administrador del bot.";
    }

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error en la API de Gemini:", error.message);
        return "❌ Ocurrió un error al contactar a la IA. Revisa la consola para más detalles.";
    }
}

// Usamos module.exports para exportar la función
module.exports = {
    askGemini
};