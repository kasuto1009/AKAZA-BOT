<<<<<<< HEAD
// commands/mp4.js (VERSIÓN "KATANA DEMONIACA")

const fs = require('fs');
const ytLib = require('../libs/youtube.js'); // Apunta a tu librería unificada con API Key
=======
// commands/mp4.js (VERSIÓN COMMONJS - ENVÍO COMO DOCUMENTO)

const fs = require('fs');
const DB = require('../core/db.js');
const { ytDownloadVideo } = require('../libs/youtube.js');
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'mp4',
    alias: ['video', 'ytvideo'],
<<<<<<< HEAD
    description: 'Invoca la Técnica de Sangre para manifestar un video de YouTube.',
    public: true,
    
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, prefix } = ctx;

        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `🎥 *Uso de la Técnica:*\n• ${prefix}mp4 <nombre del video>\n• ${prefix}mp4 <https://youtu.be/...>` });
=======
    description: 'Descarga un video de YouTube en formato MP4 (optimizado para WhatsApp).',
    public: true, // Público para todos los usuarios registrados
    
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, prefix } = ctx;

        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `🎥 *Uso del comando:*\n• ${prefix}mp4 nombre del video\n• ${prefix}mp4 https://youtu.be/...` });
        }

        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);

        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${prefix}registrar*.` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
        
        const query = args.join(' ');
        
        try {
<<<<<<< HEAD
            await sock.sendMessage(chatJid, { text: `👹 Activando la Técnica de Sangre para encontrar "${query}"...` });

            const videoData = await ytLib.ytMp4(query);

            let formattedDate = 'N/A';
            let yearsSinceReleaseText = '';

            if (videoData.uploadDate) {
                formattedDate = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(videoData.uploadDate);
                const currentYear = new Date().getFullYear();
                const releaseYear = videoData.uploadDate.getFullYear();
                const years = currentYear - releaseYear;
                if (years > 1) yearsSinceReleaseText = `(hace ${years} años)`;
                else if (years === 1) yearsSinceReleaseText = `(hace 1 año)`;
                else yearsSinceReleaseText = `(este año)`;
            }

            // --- FICHA TÉCNICA ESTILO "KATANA DEMONIACA" ---
            const infoMessage = 
`╪══════ 👹 ══════╪
    *~Técnica de Sangre: Visión~*

🎥 *Título:* ${videoData.title}

┫ 👤 *Canal:* ${videoData.channel}
┫ 👁️ *Vistas:* ${videoData.views.toLocaleString('es-ES')}
┫ 👍 *Likes:* ${videoData.likes.toLocaleString('es-ES')}
┫ 📅 *Lanzamiento:* ${formattedDate} ${yearsSinceReleaseText}
┫ ⏱️ *Duración:* ${videoData.duration}
┫ 🔗 *Enlace:* ${videoData.url}
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: `✅ ¡Visión manifestada! Iniciando descarga y re-codificación...` });

            // Enviamos el video con la ficha técnica como caption
            await sock.sendMessage(chatJid, {
                video: fs.readFileSync(videoData.filePath),
                mimetype: 'video/mp4',
                caption: infoMessage,
                fileName: `${videoData.title}.mp4`,
=======
            await sock.sendMessage(chatJid, { text: `🔍 Buscando y descargando "${query}" en MP4 ...` });

            const videoData = await ytDownloadVideo(query);
            if (!videoData || !videoData.filePath) {
                throw new Error('No se pudo descargar el video desde YouTube.');
            }
            
            let formattedDate = 'N/A';
            if (videoData.uploadDate) {
                const year = videoData.uploadDate.substring(0, 4);
                const month = videoData.uploadDate.substring(4, 6);
                const day = videoData.uploadDate.substring(6, 8);
                formattedDate = `${day}-${month}-${year}`;
            }

            const caption = 
`🌟 ━━━━━ ✦ ━━━━━ 🌟
🎥 *${videoData.title}*

👤 *Canal:* ${videoData.channel}
👁️ *Vistas:* ${videoData.views?.toLocaleString('es-ES') || 'N/A'}
👍 *Likes:* ${videoData.likes?.toLocaleString('es-ES') || 'N/A'}
📅 *Lanzamiento:* ${formattedDate}
⏱️ *Duración:* ${videoData.duration || 'N/A'}
🌟 ━━━━━ ✦ ━━━━━ 🌟`;

            // =================================================================
            // CAMBIO CLAVE: Enviamos el video como un DOCUMENTO, no como un 'video' normal.
            // Esto evita los problemas de procesamiento y tamaño de WhatsApp.
            // =================================================================
            await sock.sendMessage(chatJid, {
                document: fs.readFileSync(videoData.filePath), // Se envía como documento
                mimetype: 'video/mp4',
                fileName: `${videoData.title}.mp4`, // Nombre del archivo que verá el usuario
                caption: caption, // La descripción detallada
                // Se puede añadir un thumbnail para el documento si la API de Baileys lo permite directamente
                // thumbnail: fs.readFileSync(path.join(__dirname, 'ruta/a/miniatura.jpg')) 
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            });

            fs.unlinkSync(videoData.filePath);

        } catch (error) {
<<<<<<< HEAD
            console.error('[MP4 ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ *Error al ejecutar la Técnica de Sangre para la visión.*\n\n${error.message}` });
=======
            console.error('[MP4 COMMAND ERROR]', error);
            let errorMessage = '❌ *Error al procesar la solicitud de video*\n\n';

            if (error.message.includes('Falló el proceso de descarga y/u optimización de video.') || error.message.includes('yt-dlp no pudo descargar')) {
                errorMessage += '🔧 Hubo un problema técnico con la descarga o la optimización del video. Intenta con otro video o más tarde.';
            } else if (error.message.includes('unavailable') || error.message.includes('private') || error.message.includes('Sign in to confirm')) {
                errorMessage += '📹 El video no está disponible, es privado, tiene restricciones de edad o YouTube detectó un bot. Intenta con otro video.';
            } else if (error.message.includes('No se encontraron resultados')) {
                errorMessage += '🔍 No se encontraron resultados para tu búsqueda.';
            } else {
                errorMessage += `🔧 Error técnico: ${error.message}`;
            }
            await sock.sendMessage(chatJid, { text: errorMessage });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};