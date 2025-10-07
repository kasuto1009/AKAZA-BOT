// commands/sticker.js (VERSIÓN COMMONJS - CORREGIDA Y MEJORADA)

const fs = require('fs');
const DB = require('../core/db.js');
const { writeExif } = require('../libs/fuctions.js');
// --- CORRECCIÓN: Se importa la función de descarga desde Baileys ---
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker', 'stick'],
    description: 'Crear un sticker a partir de una imagen o video.',
    public: false, // Requiere registro

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);
            
            if (!user) {
                return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${PREFIX}registrar*.` });
            }
            
            // --- VERIFICACIÓN DE LÍMITES (SOLO PARA USUARIOS NORMALES) ---
            const isAdmin = DB.isAdmin(userPhone) || userJid === OWNER_NUMBER;

            if (!isAdmin && user.limit < 1) {
                return sock.sendMessage(chatJid, { text: `❌ Necesitas al menos 1 límite para crear stickers.\n💎 Límites actuales: ${user.limit}` });
            }

            // Lógica de detección de medios mejorada
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const targetMessage = quoted ? { key: msg.key, message: quoted } : msg;
            const messageType = Object.keys(targetMessage.message || {})[0];

            if (messageType !== 'imageMessage' && messageType !== 'videoMessage') {
                return sock.sendMessage(chatJid, { text: `🏷️ Para crear un sticker, envía una imagen o video corto con el comando *${PREFIX}sticker* o responde a uno con el comando.` });
            }

            await sock.sendMessage(chatJid, { text: '🏷️ Procesando tu sticker, espera un momento...' });

            // --- CORRECCIÓN: Se usa la función de descarga importada ---
            const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer');
            if (!mediaBuffer) throw new Error('No se pudo descargar el medio.');

            // Procesar y añadir metadatos (EXIF)
            const stickerMetadata = {
                packname: process.env.PACKNAME || "Akaza Bot",
                author: user.alias || user.name || userPhone
            };

            const isVideo = messageType === 'videoMessage';
            
            if (isVideo && (targetMessage.message.videoMessage.seconds > 15)) {
                return sock.sendMessage(chatJid, { text: '❌ El video es muy largo. El máximo para stickers es de 15 segundos.' });
            }

            const stickerFilePath = await writeExif(mediaBuffer, stickerMetadata, isVideo ? 'video' : 'image');
            if (!stickerFilePath) throw new Error('Error al procesar el sticker.');

            // Enviar el sticker
            await sock.sendMessage(chatJid, {
                sticker: fs.readFileSync(stickerFilePath)
            });

            // Limpiar el archivo temporal
            fs.unlinkSync(stickerFilePath);

            // --- REDUCCIÓN DE LÍMITES (SOLO PARA USUARIOS NORMALES) ---
            if (!isAdmin) {
                DB.reduceLimit(userPhone, 1);
                DB.addExp(userPhone, 5);
                const newLimit = user.limit - 1;
                await sock.sendMessage(chatJid, { text: `✅ ¡Sticker creado!\n\n💎 *Límites utilizados:* 1\n💎 *Límites restantes:* ${newLimit}` });
            } else {
                await sock.sendMessage(chatJid, { text: `✅ ¡Sticker creado!\n\n👑 *Uso ilimitado como administrador.*` });
            }

        } catch (error) {
            console.error('[STICKER ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al crear tu sticker. Asegúrate de que la imagen o video no estén dañados.` });
        }
    }
};