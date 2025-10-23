// commands/tiktok.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const { Tiktok, ttimg } = require('../libs/tiktok.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl'],
    description: 'Invoca una técnica para capturar la esencia de un TikTok (video o imágenes).',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, prefix } = ctx;
        const query = args[0];

        if (!query || !query.includes('tiktok.com')) {
            const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica Incompleta ~*

Debes proveer el enlace a un pergamino de TikTok para capturar su esencia.

┫ *Ejemplo de uso:*
┃   \`${prefix}tiktok <URL de TikTok>\`
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }

        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);

        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para usar esta técnica. Usa *${prefix}registrar*.` });
        }

        try {
            await sock.sendMessage(chatJid, { text: `👹 Capturando la esencia del TikTok...` });

            if (query.includes('/photo/') || query.includes('/photos/')) {
                const result = await ttimg(query);
                if (!result || !result.data || !Array.isArray(result.data)) {
                    throw new Error('No se pudieron obtener los fragmentos de esencia (imágenes).');
                }

                await sock.sendMessage(chatJid, { text: `✅ Esencia de imágenes capturada. Enviando ${result.data.length} fragmentos...` });

                for (const imageUrl of result.data) {
                    await sock.sendMessage(chatJid, { image: { url: imageUrl } });
                }

            } else {
                const result = await Tiktok(query);
                if (!result || !result.nowm) {
                    throw new Error('No se pudo obtener la esencia sin marcas (video).');
                }

                const captionMessage =
`╪══════ 👹 ══════╪
    *~ Esencia de Video Capturada ~*

┫ 🎵 *Título:* ${result.title || 'Desconocido'}
┫ 👤 *Autor:* ${result.author || 'Desconocido'}
╪══════ •| ✧ |• ══════╪`

                await sock.sendMessage(chatJid, {
                    video: { url: result.nowm },
                    caption: captionMessage
                });
            }

        } catch (error) {
            console.error('[TIKTOK ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ Error al capturar la esencia del TikTok. Asegúrate de que el enlace sea válido y público.\n\n_Detalles: ${error.message}_` });
        }
    }
};