<<<<<<< HEAD
const QRCode = require('qrcode');
const DB = require('../core/db.js');
const { downloadMediaMessage, getContentType } = require('@whiskeysockets/baileys');
const uploader = require('../libs/uploader.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'qr',
    alias: ['qrcode'],
    description: 'Forja un sello arcano (QR) a partir de texto, imagen, video o sticker.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, store } = ctx;

        // 🚨 Autenticación (Asumiendo que DB.getUserByPhone usa el número limpio)
        const user = DB.getUserByPhone(userJid.split('@')[0]);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes registrarte primero. Usa *${PREFIX}registrar*.` });
        }

        let textToEncode = args.join(' ');
        let mediaToUpload = null;

        // Uso seguro de optional chaining (?)
        const quotedInfo = msg.message?.extendedTextMessage?.contextInfo;
        const messageType = getContentType(msg.message);

        try {
            if (quotedInfo?.quotedMessage) {
                // Si el quotedMessage existe, podemos asumir que quotedInfo.stanzaId (id) y remoteJid (chatJid) también lo harán
                
                // 🚨 CORRECCIÓN CLAVE: Cargar el mensaje citado del store
                // Se envían chatJid (RemoteJid) y el ID del mensaje citado (stanzaId)
                const quotedMsg = await store.loadMessage(chatJid, quotedInfo.stanzaId);
                
                // Si la carga falla o el mensaje no tiene contenido:
                if (!quotedMsg || !quotedMsg.message) {
                    // Lanzar un error para que caiga en el catch y notifique al usuario.
                    throw new Error("El mensaje citado no pudo ser cargado.");
                }
                
                const quotedType = getContentType(quotedMsg.message);

                if (['imageMessage', 'stickerMessage', 'videoMessage', 'audioMessage'].includes(quotedType)) {
                    mediaToUpload = quotedMsg;
                } else if (!textToEncode) {
                    // Acceso seguro al texto citado
                    textToEncode = quotedMsg.message.conversation || quotedMsg.message.extendedTextMessage?.text || '';
                }
            // Si el mensaje es una media, la usamos directamente
            } else if (['imageMessage', 'videoMessage', 'stickerMessage'].includes(messageType) && msg.message[messageType]?.caption?.toLowerCase().startsWith(`${PREFIX}qr`)) {
                mediaToUpload = msg;
            }
        } catch (storeError) {
            console.error('[QR STORE ERROR]', storeError);
            // Si falla el store y no hay texto, lanzamos el error de uso.
            if (!textToEncode && !mediaToUpload) {
                return sock.sendMessage(chatJid, { text: '❌ Error al cargar mensaje citado. Por favor, intenta citar un mensaje más reciente o envía el texto directamente.' });
            }
        }

        if (!textToEncode && !mediaToUpload) {
            return sock.sendMessage(chatJid, { text:
`╪══════ 👹 ══════╪
*~ Técnica Incompleta ~*
Debes proveer:
› Texto o enlace.
› Responder a un mensaje con imagen, video o sticker.
› Enviar imagen, GIF o sticker con el comando.

Ejemplo: \`${PREFIX}qr Hola Mundo\`
╪══════ •| ✧ |• ══════╪`
            });
        }

        try {
            await sock.sendMessage(chatJid, { text: '👹 Forjando el sello arcano...' });

            if (mediaToUpload) {
                const buffer = await downloadMediaMessage(mediaToUpload, 'buffer');
                const { fileTypeFromBuffer } = await import('file-type'); 
                const fileType = await fileTypeFromBuffer(buffer);

                // Para todos los tipos de media, subimos y usamos el enlace
                console.log(`[QR] Subiendo archivo de tipo ${fileType?.mime || 'desconocido'}...`);
                const res = await uploader.UploadFileUgu(buffer, fileType?.ext || 'file');
                textToEncode = res?.url || null;
                if (!textToEncode) throw new Error("No se pudo obtener el enlace del archivo.");
            }

            const qrDataURL = await QRCode.toDataURL(textToEncode || ' ', { scale: 8, margin: 2 });
            const imageBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');

            await sock.sendMessage(chatJid, {
                image: imageBuffer,
                caption:
`╪══════ 👹 ══════╪
*~ Sello Arcano Forjado ~*
╪══════ •| ✧ |• ══════╪`
            });

        } catch (error) {
            console.error('[QR COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al forjar el sello: ${error.message}` });
        }
    }
=======
// commands/qr.js (VERSIÓN COMMONJS)

const QRCode = require('qrcode');
const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'qr',
    alias: ['qrcode'],
    description: 'Genera un código QR a partir de un texto.',
    public: true, // Comando público, pero requiere registro para ser consistente

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // Verificación de registro (opcional, pero recomendado para consistencia)
        const user = DB.getUserByPhone(userJid.split('@')[0]);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar este comando, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        // Verificar si se proporcionó texto para el QR
        if (args.length === 0) {
            return sock.sendMessage(chatJid, { text: `💡 *Uso del comando:*\n• ${PREFIX}qr El texto o enlace que quieras convertir` });
        }

        const textToEncode = args.join(' ');

        try {
            await sock.sendMessage(chatJid, { text: '⏳ Generando tu código QR...' });

            // Generar el código QR como un Data URL (una cadena de texto en base64)
            const qrDataURL = await QRCode.toDataURL(textToEncode, { scale: 8 });

            // Convertir el Data URL a un Buffer, que es lo que Baileys necesita para enviar una imagen
            const imageBuffer = Buffer.from(qrDataURL.split(',')[1], 'base64');

            // Enviar la imagen del QR con una descripción
            await sock.sendMessage(chatJid, {
                image: imageBuffer,
                caption: `✅ *¡Código QR generado!*\n\n*Contenido:* ${textToEncode}`
            });

        } catch (error) {
            console.error('[QR COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al generar el código QR.' });
        }
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};