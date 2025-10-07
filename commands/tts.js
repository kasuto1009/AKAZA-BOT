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
};