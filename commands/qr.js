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
};