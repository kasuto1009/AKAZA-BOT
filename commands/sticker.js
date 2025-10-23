// commands/sticker.js (VERSIÓN "KATANA DEMONIACA")

const fs = require('fs');
const DB = require('../core/db.js');
const { writeExif } = require('../libs/fuctions.js');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick', 's'],
    description: 'Forja un Sello de Esencia (sticker) a partir de una imagen o video.',
    public: false, // Requiere registro

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);
            
            if (!user) {
                return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para forjar Sellos de Esencia. Usa *${PREFIX}registrar*.` });
            }
            
            const isAdmin = DB.isAdmin(userPhone) || userJid === OWNER_NUMBER;

            if (!isAdmin && user.limit < 1) {
                const noLimitMessage = 
`╪══════ 👹 ══════╪
    *~ Esencia Insuficiente ~*

No posees suficiente energía para forjar este sello.

┫ ✨ *Tu esencia actual:* ${user.limit}
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: noLimitMessage });
            }

            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const targetMessage = quoted ? { key: msg.key, message: quoted } : msg;
            const messageType = Object.keys(targetMessage.message || {})[0];

            if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
                const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica Incompleta ~*

Para forjar un Sello de Esencia, envía una imagen o video corto con la técnica \`${PREFIX}sticker\`, o responde a uno con el comando.
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: usageMessage });
            }

            await sock.sendMessage(chatJid, { text: '👹 Forjando tu Sello de Esencia... espera un momento.' });

            const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer');
            if (!mediaBuffer) throw new Error('No se pudo descargar el medio.');

            const stickerMetadata = {
                packname: process.env.PACKNAME || "Akaza Bot",
                author: user.alias || user.name || userPhone
            };

            const isVideo = messageType === 'videoMessage';
            
            if (isVideo && (targetMessage.message.videoMessage.seconds > 15)) {
                return sock.sendMessage(chatJid, { text: '❌ El video es muy largo. Un Sello de Esencia no puede superar los 15 segundos.' });
            }

            const stickerFilePath = await writeExif(mediaBuffer, stickerMetadata, isVideo ? 'video' : 'image');
            if (!stickerFilePath) throw new Error('Error al procesar el sello.');

            await sock.sendMessage(chatJid, {
                sticker: fs.readFileSync(stickerFilePath)
            });

            fs.unlinkSync(stickerFilePath);

            if (!isAdmin) {
                DB.reduceLimit(userPhone, 1);
                DB.addExp(userPhone, 5);
                const newLimit = user.limit - 1;
                const successMessage = 
`╪══════ 👹 ══════╪
    *~ Sello Forjado ~*

┫ ✨ *Esencia utilizada:* 1
┫ ✨ *Esencia restante:* ${newLimit}
╪══════ •| ✧ |• ══════╪`;
                await sock.sendMessage(chatJid, { text: successMessage });
            } else {
                await sock.sendMessage(chatJid, { text: `👑 *Sello Forjado con Éxito. Uso ilimitado como Hashira.*` });
            }

        } catch (error) {
            console.error('[STICKER ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al forjar tu Sello de Esencia. Asegúrate de que la imagen o video no estén corruptos.` });
        }
    }
};