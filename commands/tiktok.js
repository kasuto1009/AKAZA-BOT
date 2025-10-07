// commands/tiktok.js (VERSIÓN COMMONJS - SIN LÍMITES)

const DB = require('../core/db.js');
const { Tiktok, ttimg } = require('../libs/tiktok.js'); // Importamos las funciones de nuestra librería

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    description: 'Descarga videos o imágenes de TikTok desde una URL.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, prefix } = ctx;
        const query = args[0];

        if (!query || !query.includes('tiktok.com')) {
            return sock.sendMessage(chatJid, { text: `🎵 *Uso del comando:*\n• ${prefix}tiktok <URL del video o slideshow de TikTok>` });
        }

        // Se mantiene la verificación de registro, pero se eliminan los límites.
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);

        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${prefix}registrar*.` });
        }

        try {
            await sock.sendMessage(chatJid, { text: `⬇️ Descargando contenido de TikTok...` });

            // Detectamos si es un slideshow de imágenes o un video
            if (query.includes('/photo/') || query.includes('/photos/')) {
                // Es un slideshow de imágenes
                const result = await ttimg(query);
                if (!result || !result.data || !Array.isArray(result.data)) {
                    throw new Error('No se pudieron obtener las imágenes.');
                }

                await sock.sendMessage(chatJid, { text: `Enviando ${result.data.length} imágenes...` });

                for (const imageUrl of result.data) {
                    await sock.sendMessage(chatJid, { image: { url: imageUrl } });
                }

            } else {
                // Es un video (ya usa la versión sin marca de agua)
                const result = await Tiktok(query);
                if (!result || !result.nowm) {
                    throw new Error('No se pudo obtener el video sin marca de agua.');
                }

                await sock.sendMessage(chatJid, {
                    video: { url: result.nowm },
                    caption: `🎵 *${result.title || 'Video de TikTok'}*\n👤 *Autor:* ${result.author || 'Desconocido'}`
                });
            }

            // Se ha eliminado toda la lógica de reducción de límites.

        } catch (error) {
            console.error('[TIKTOK ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ Error al descargar desde TikTok. Asegúrate de que el enlace sea válido y público.\n\n_Detalles: ${error.message}_` });
        }
    }
};