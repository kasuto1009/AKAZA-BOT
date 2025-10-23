<<<<<<< HEAD
// commands/play.js (VERSIÓN "KATANA DEMONIACA" CON MANEJO DE ARCHIVOS GRANDES)

const fs = require('fs');
const ytLib = require('../libs/youtube.js'); // Apunta a tu librería unificada con API Key

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'play',
    alias: ['p', 'musica', 'música'],
    description: 'Invoca la Técnica de Sangre para obtener y reproducir una melodía de YouTube.',
    public: true,
    
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, prefix } = ctx;

        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `🎵 *Uso de la Técnica:*\n• ${prefix}play <nombre de la canción>\n• ${prefix}play <https://youtu.be/...>` });
        }
        
        const query = args.join(' ');
        
        try {
            await sock.sendMessage(chatJid, { text: `👹 Activando la Técnica de Sangre para encontrar "${query}"...` });

            // audioData ahora incluirá fileSizeInMB (gracias a la mejora en libs/youtube.js)
            const audioData = await ytLib.ytMp3(query);

            let formattedDate = 'N/A';
            let yearsSinceReleaseText = '';

            if (audioData.uploadDate) {
                formattedDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(audioData.uploadDate);
                const currentYear = new Date().getFullYear();
                const releaseYear = audioData.uploadDate.getFullYear();
                const years = currentYear - releaseYear;
                if (years > 1) yearsSinceReleaseText = `(hace ${years} años)`;
                else if (years === 1) yearsSinceReleaseText = `(hace 1 año)`;
                else yearsSinceReleaseText = `(este año)`;
            }

            // --- FICHA TÉCNICA ESTILO "KATANA DEMONIACA" ---
            const infoMessage = 
`╪══════ 👹 ══════╪
    *~Técnica de Sangre: Melodía~*

🎵 *Título:* ${audioData.title}

┫ 👤 *Artista/Canal:* ${audioData.channel}
┫ 👁️ *Vistas:* ${audioData.views.toLocaleString('es-ES')}
┫ 👍 *Likes:* ${audioData.likes.toLocaleString('es-ES')}
┫ 📅 *Lanzamiento:* ${formattedDate} ${yearsSinceReleaseText}
┫ ⏱️ *Duración:* ${audioData.duration}
┫ 🔗 *Enlace:* ${audioData.url}
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: `✅ ¡Melodía detectada! Preparando envío...` });

            if (audioData.thumb) {
                await sock.sendMessage(chatJid, { 
                    image: { url: audioData.thumb },
                    caption: infoMessage 
                });
            } else {
                await sock.sendMessage(chatJid, { text: infoMessage });
            }

            // --- TÉCNICA DEL PERGAMINO PESADO (Envío inteligente) ---
            const WHATSAPP_AUDIO_LIMIT_MB = 16; // Límite de WhatsApp para enviar como nota de voz
            if (audioData.fileSizeInMB > WHATSAPP_AUDIO_LIMIT_MB) {
                console.log(`[PLAY] Melodía demasiado pesada (${audioData.fileSizeInMB.toFixed(2)} MB). Enviando como documento.`);
                await sock.sendMessage(chatJid, {
                    document: fs.readFileSync(audioData.filePath),
                    mimetype: 'audio/mpeg',
                    fileName: `${audioData.title}.mp3`,
                    caption: '👹 La melodía es demasiado poderosa y ha sido sellada en este pergamino para preservar su calidad.',
                    // Para que se abra con reproductor de audio, no de video
                    ptt: false 
                });
            } else {
                console.log(`[PLAY] Melodía ligera (${audioData.fileSizeInMB.toFixed(2)} MB). Enviando como nota de voz.`);
                await sock.sendMessage(chatJid, {
                    audio: fs.readFileSync(audioData.filePath),
                    mimetype: 'audio/mpeg',
                    fileName: `${audioData.title}.mp3`,
                    ptt: true // Enviarlo como nota de voz si es ligero
                });
            }

            fs.unlinkSync(audioData.filePath); // Limpiar archivo temporal

        } catch (error) {
            console.error('[PLAY ERROR]', error);
            // Mensaje de error temático y genérico para el usuario
            await sock.sendMessage(chatJid, { text: `❌ *La técnica de la melodía no pudo ser completada.*\n\n_Detalles del fallo: ${error.message}_` });
        }
    }
=======
// commands/play.js (VERSIÓN SIN LÍMITES)

const fs = require('fs');
const DB = require('../core/db.js');
const ytLib = require('../libs/youtube.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'play',
    alias: ['p', 'musica', 'música'],
    description: 'Descargar audio de YouTube por nombre o URL',
    public: true,
    
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, prefix } = ctx;

        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `🎵 *Uso del comando:*\n• ${prefix}play nombre de la canción\n• ${prefix}play https://youtu.be/...` });
        }

        // Se mantiene la verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);

        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${prefix}registrar*.` });
        }
        
        const query = args.join(' ');
        
        try {
            await sock.sendMessage(chatJid, { text: `🔍 Buscando y descargando "${query}"...` });

            const audioData = await ytLib.ytPlay(query);
            if (!audioData || !audioData.filePath) {
                throw new Error('No se pudo descargar el audio desde YouTube.');
            }
            
            let formattedDate = 'N/A';
            if (audioData.uploadDate) {
                const year = audioData.uploadDate.substring(0, 4);
                const month = audioData.uploadDate.substring(4, 6);
                const day = audioData.uploadDate.substring(6, 8);
                formattedDate = `${day}-${month}-${year}`;
            }

            const infoMessage = 
`🌟 ━━━━━ ✦ ━━━━━ 🌟
🎵 *${audioData.title}*

👤 *Artista:* ${audioData.channel}
👁️ *Vistas:* ${audioData.views?.toLocaleString('es-ES') || 'N/A'}
👍 *Likes:* ${audioData.likes?.toLocaleString('es-ES') || 'N/A'}
📅 *Lanzamiento:* ${formattedDate}
⏱️ *Duración:* ${audioData.duration || 'N/A'}
🌟 ━━━━━ ✦ ━━━━━ 🌟`;

            if (audioData.thumb) {
                await sock.sendMessage(chatJid, { 
                    image: { url: audioData.thumb },
                    caption: infoMessage 
                });
            } else {
                await sock.sendMessage(chatJid, { text: infoMessage });
            }

            await sock.sendMessage(chatJid, {
                audio: fs.readFileSync(audioData.filePath),
                mimetype: 'audio/mpeg',
                fileName: `${audioData.title}.mp3`,
                ptt: false,
            });

            fs.unlinkSync(audioData.filePath);

            // Se ha eliminado toda la lógica de reducción de límites.

        } catch (error) {
            console.error('[PLAY ERROR]', error);
            let errorMessage = '❌ *Error al procesar la solicitud*\n\n';
            if (error.message.includes('unavailable') || error.message.includes('private')) {
                errorMessage += '📹 El video no está disponible, es privado o tiene restricciones.';
            } else if (error.message.includes('No se encontraron resultados')) {
                errorMessage += '🔍 No se encontraron resultados para tu búsqueda.';
            } else {
                errorMessage += `🔧 Error técnico: ${error.message}`;
            }
            await sock.sendMessage(chatJid, { text: errorMessage });
        }
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};