// commands/mp4.js (VERSIÓN COMMONJS - ENVÍO COMO DOCUMENTO)

const fs = require('fs');
const DB = require('../core/db.js');
const { ytDownloadVideo } = require('../libs/youtube.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'mp4',
    alias: ['video', 'ytvideo'],
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
        }
        
        const query = args.join(' ');
        
        try {
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
            });

            fs.unlinkSync(videoData.filePath);

        } catch (error) {
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
        }
    }
};