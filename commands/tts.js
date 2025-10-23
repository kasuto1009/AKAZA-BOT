<<<<<<< HEAD
// commands/tts.js (VERSIÓN FINAL: OPUS PARA COMPATIBILIDAD CON WHATSAPP)

const DB = require('../core/db.js');
const axios = require('axios');
const googleTTS = require('google-tts-api'); 
const fs = require('fs'); // Necesario para trabajar con archivos
const { promisify } = require('util');
const exec = promisify(require('child_process').exec); // Usar exec para FFmpeg
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('@ffmpeg-installer/ffmpeg');

// Configurar fluent-ffmpeg para usar el binario estático (más seguro)
ffmpeg.setFfmpegPath(ffmpegStatic.path);

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'tts',
    alias: ['textoavoz', 'hablar'],
    description: 'Invoca una técnica para canalizar una voz y recitar un texto.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, rawPhoneNumber } = ctx;
        const sender = msg.pushName || rawPhoneNumber;

        // 👹 Verificación de registro
        const user = DB.getUserByPhone(rawPhoneNumber);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 *Aliento Detenido:* Debes forjar tu leyenda para usar esta técnica de canalización. Usa *${PREFIX}registrar*.` });
        }

        // Lógica para detectar el idioma y el texto
        let lang = 'es'; // Idioma por defecto
        let text;
        
        const potentialLang = args[0] ? args[0].toLowerCase() : '';
        if (potentialLang.length <= 3 && !potentialLang.match(/\d/)) { 
             lang = potentialLang;
             text = args.slice(1).join(' ');
        } else {
            text = args.join(' ');
            lang = 'es';
        }
        
        if (!text) {
            const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica Incompleta ~*

Debes proveer el pergamino a recitar.
(Idioma por defecto: *Español - ES*)

┫ *Uso de la Técnica:*
┃   \`${PREFIX}tts <texto>\`
┃   O \`${PREFIX}tts <código> <texto>\`

┫ *Ejemplo:*
┃   \`${PREFIX}tts en Destroy the slayer\`
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }

        if (text.length > 200) {
            return sock.sendMessage(chatJid, { text: '❌ *Pergamino Roto:* El texto excede los 200 caracteres permitidos para esta técnica.' });
        }
        
        // Rutas temporales para la conversión (usando el JID para evitar conflictos)
        const tempInputPath = path.join(__dirname, `temp_input_${rawPhoneNumber}.mp3`);
        const tempOutputPath = path.join(__dirname, `temp_output_${rawPhoneNumber}.opus`);

        try {
            // 🚨 CONFIRMACIÓN DE EJECUCIÓN MEJORADA
            await sock.sendMessage(chatJid, { 
                text: `😈 *Técnica de Sangre: Voz del Inframundo.*\n\nCanalizando voz...` 
            });

            // 1. Obtener la URL del audio (Lógica de compatibilidad de librería)
            let url;
            if (googleTTS.getAllAudioUrls) {
                const results = googleTTS.getAllAudioUrls(text, { lang, slow: false });
                if (!results || results.length === 0) {
                    throw new Error("No se pudo obtener la URL de audio o el idioma es inválido.");
                }
                url = results[0].url;
            } else if (googleTTS.getAudioUrl) {
                url = googleTTS.getAudioUrl(text, { lang, slow: false, host: "https://translate.google.com" });
            } else if (typeof googleTTS === "function") {
                 const results = await googleTTS(text, lang, 1);
                 url = Array.isArray(results) ? results[0].url : results;
            } else {
                 throw new Error("Librería TTS no compatible.");
            }

            // 2. Descargar audio desde la URL (MP3)
            const response = await axios.get(url, { responseType: "arraybuffer" });
            const audioBuffer = Buffer.from(response.data);
            
            // 3. Guardar temporalmente el MP3
            await fs.promises.writeFile(tempInputPath, audioBuffer);

            // 4. CONVERSIÓN CRÍTICA a OPUS (.ogg) usando FFmpeg
            await new Promise((resolve, reject) => {
                ffmpeg(tempInputPath)
                    .audioCodec('libopus') // Usar códec OPUS
                    .toFormat('ogg') 
                    .on('error', (err) => {
                        console.error('FFmpeg error:', err);
                        reject(new Error(`FFmpeg falló. ¿FFmpeg instalado? ${err.message}`));
                    })
                    .on('end', () => {
                        resolve();
                    })
                    .save(tempOutputPath);
            });

            // 5. Leer el archivo OPUS convertido
            const opusBuffer = await fs.promises.readFile(tempOutputPath);

            // 6. Enviar el audio como nota de voz compatible (OPUS)
            await sock.sendMessage(chatJid, { 
                audio: opusBuffer, 
                mimetype: 'audio/ogg; codecs=opus', // Mime type correcto para PTT
                ptt: true // CRÍTICO: Indica que es una nota de voz
            });

        } catch (error) {
            console.error("[TTS COMMAND ERROR]", error);
            // Mensaje de error dramático que indica el posible problema de FFmpeg
            await sock.sendMessage(chatJid, { 
                text: `🩸 *Fallo Catastrófico:* El ritual de voz ha fallado. 
Esto puede ser por:
1. Código de idioma inválido.
2. **FFmpeg no está instalado en el servidor (principal causa de este error).**`
            });
        } finally {
            // 7. Limpieza
            if (fs.existsSync(tempInputPath)) await fs.promises.unlink(tempInputPath).catch(() => {});
            if (fs.existsSync(tempOutputPath)) await fs.promises.unlink(tempOutputPath).catch(() => {});
        }
    },
=======
// commands/tts.js (VERSIÓN COMMONJS)

const { getAudioUrl } = require('google-tts-api');
const DB = require('../core/db.js');
const axios = require('axios');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'tts',
    alias: ['textoavoz', 'hablar'],
    description: 'Convierte un texto a voz en un idioma específico.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // Verificación de registro
        const user = DB.getUserByPhone(userJid.split('@')[0]);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        // Verificar el uso correcto del comando
        if (args.length < 2) {
            return sock.sendMessage(chatJid, { text: `🗣️ *Uso del comando:*\n• ${PREFIX}tts <código_idioma> <texto>\n\n*Ejemplo:* ${PREFIX}tts es Hola, ¿cómo estás?\n\n*Idiomas comunes:* es (español), en (inglés), ja (japonés), pt (portugués).` });
        }

        const lang = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        if (text.length > 200) {
            return sock.sendMessage(chatJid, { text: '❌ El texto es demasiado largo. El máximo es de 200 caracteres.' });
        }

        try {
            await sock.sendMessage(chatJid, { text: '⏳ Generando audio...' });

            // Generar la URL del audio
            const audioUrl = getAudioUrl(text, { lang: lang, slow: false });
            
            // Descargar el audio como un buffer
            const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
            const audioBuffer = Buffer.from(response.data);

            // Enviar el audio como una nota de voz (ptt: true)
            await sock.sendMessage(chatJid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true // ptt = Push To Talk (nota de voz)
            });

        } catch (error) {
            console.error('[TTS COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al generar el audio. Asegúrate de que el código del idioma sea válido.' });
        }
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};