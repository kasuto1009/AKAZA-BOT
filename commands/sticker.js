<<<<<<< HEAD
// commands/sticker.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/sticker.js (VERSIÓN COMMONJS - CORREGIDA Y MEJORADA)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const fs = require('fs');
const DB = require('../core/db.js');
const { writeExif } = require('../libs/fuctions.js');
<<<<<<< HEAD
=======
// --- CORRECCIÓN: Se importa la función de descarga desde Baileys ---
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'sticker',
<<<<<<< HEAD
    alias: ['s', 'stiker', 'stick', 's'],
    description: 'Forja un Sello de Esencia (sticker) a partir de una imagen o video.',
=======
    alias: ['s', 'stiker', 'stick'],
    description: 'Crear un sticker a partir de una imagen o video.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    public: false, // Requiere registro

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);
            
            if (!user) {
<<<<<<< HEAD
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

=======
                return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${PREFIX}registrar*.` });
            }
            
            // --- VERIFICACIÓN DE LÍMITES (SOLO PARA USUARIOS NORMALES) ---
            const isAdmin = DB.isAdmin(userPhone) || userJid === OWNER_NUMBER;

            if (!isAdmin && user.limit < 1) {
                return sock.sendMessage(chatJid, { text: `❌ Necesitas al menos 1 límite para crear stickers.\n💎 Límites actuales: ${user.limit}` });
            }

            // Lógica de detección de medios mejorada
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const targetMessage = quoted ? { key: msg.key, message: quoted } : msg;
            const messageType = Object.keys(targetMessage.message || {})[0];

            if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
<<<<<<< HEAD
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

=======
                return sock.sendMessage(chatJid, { text: `🏷️ Para crear un sticker, envía una imagen o video corto con el comando *${PREFIX}sticker* o responde a uno con el comando.` });
            }

            await sock.sendMessage(chatJid, { text: '🏷️ Procesando tu sticker, espera un momento...' });

            // --- CORRECCIÓN: Se usa la función de descarga importada ---
            const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer');
            if (!mediaBuffer) throw new Error('No se pudo descargar el medio.');

            // Procesar y añadir metadatos (EXIF)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            const stickerMetadata = {
                packname: process.env.PACKNAME || "Akaza Bot",
                author: user.alias || user.name || userPhone
            };

            const isVideo = messageType === 'videoMessage';
            
            if (isVideo && (targetMessage.message.videoMessage.seconds > 15)) {
<<<<<<< HEAD
                return sock.sendMessage(chatJid, { text: '❌ El video es muy largo. Un Sello de Esencia no puede superar los 15 segundos.' });
            }

            const stickerFilePath = await writeExif(mediaBuffer, stickerMetadata, isVideo ? 'video' : 'image');
            if (!stickerFilePath) throw new Error('Error al procesar el sello.');

=======
                return sock.sendMessage(chatJid, { text: '❌ El video es muy largo. El máximo para stickers es de 15 segundos.' });
            }

            const stickerFilePath = await writeExif(mediaBuffer, stickerMetadata, isVideo ? 'video' : 'image');
            if (!stickerFilePath) throw new Error('Error al procesar el sticker.');

            // Enviar el sticker
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            await sock.sendMessage(chatJid, {
                sticker: fs.readFileSync(stickerFilePath)
            });

<<<<<<< HEAD
            fs.unlinkSync(stickerFilePath);

=======
            // Limpiar el archivo temporal
            fs.unlinkSync(stickerFilePath);

            // --- REDUCCIÓN DE LÍMITES (SOLO PARA USUARIOS NORMALES) ---
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            if (!isAdmin) {
                DB.reduceLimit(userPhone, 1);
                DB.addExp(userPhone, 5);
                const newLimit = user.limit - 1;
<<<<<<< HEAD
                const successMessage = 
`╪══════ 👹 ══════╪
    *~ Sello Forjado ~*

┫ ✨ *Esencia utilizada:* 1
┫ ✨ *Esencia restante:* ${newLimit}
╪══════ •| ✧ |• ══════╪`;
                await sock.sendMessage(chatJid, { text: successMessage });
            } else {
                await sock.sendMessage(chatJid, { text: `👑 *Sello Forjado con Éxito. Uso ilimitado como Hashira.*` });
=======
                await sock.sendMessage(chatJid, { text: `✅ ¡Sticker creado!\n\n💎 *Límites utilizados:* 1\n💎 *Límites restantes:* ${newLimit}` });
            } else {
                await sock.sendMessage(chatJid, { text: `✅ ¡Sticker creado!\n\n👑 *Uso ilimitado como administrador.*` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            }

        } catch (error) {
            console.error('[STICKER ERROR]', error);
<<<<<<< HEAD
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al forjar tu Sello de Esencia. Asegúrate de que la imagen o video no estén corruptos.` });
=======
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al crear tu sticker. Asegúrate de que la imagen o video no estén dañados.` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};