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
};