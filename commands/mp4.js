// commands/mp4.js (VERSIÓN "KATANA DEMONIACA")

const fs = require('fs');
const ytLib = require('../libs/youtube.js'); // Apunta a tu librería unificada con API Key

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'mp4',
    alias: ['video', 'ytvideo'],
    description: 'Invoca la Técnica de Sangre para manifestar un video de YouTube.',
    public: true,
    
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, prefix } = ctx;

        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `🎥 *Uso de la Técnica:*\n• ${prefix}mp4 <nombre del video>\n• ${prefix}mp4 <https://youtu.be/...>` });
        }
        
        const query = args.join(' ');
        
        try {
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
            });

            fs.unlinkSync(videoData.filePath);

        } catch (error) {
            console.error('[MP4 ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ *Error al ejecutar la Técnica de Sangre para la visión.*\n\n${error.message}` });
        }
    }
};