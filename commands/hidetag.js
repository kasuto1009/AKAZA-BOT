// commands/hidetag.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'hidetag',
    alias: ['tag', 'notificar', 'ht', 'todos'],
    description: 'Menciona a todos los miembros del grupo en un mensaje.',
    adminOnly: true, // Indica que es un comando para administradores

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, {
                text: '❌ Este comando solo funciona en grupos.'
            });
        }

        try {
            // Obtener metadatos del grupo para verificar permisos y obtener participantes
            const metadata = await sock.groupMetadata(chatJid);

            // =================================================================
            // CORRECCIÓN: Verificación de admin robusta para LIDs y JIDs
            // Se busca al usuario por su JID en las propiedades 'id' y 'jid' del participante.
            // =================================================================
            const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));
            if (!userParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '🚫 Solo los administradores de este grupo pueden usar este comando.' });
            }

            // Crear la lista de JIDs de todos los participantes
            const participants = metadata.participants.map(p => p.id);

            // Unir los argumentos para formar el mensaje
            let message = args.join(' ').trim();

            // Verificar si se está respondiendo a un mensaje
            const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            // Si se cita un mensaje y no se escribe uno nuevo, se reenviará el citado
            if (quotedMessage && !message) {
                const quotedContent = {
                    text: msg.message.extendedTextMessage.contextInfo.quotedMessage.conversation || 
                          msg.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage?.text || 
                          '📢', // Mensaje por defecto si el citado no es texto
                    mentions: participants
                };
                
                return await sock.sendMessage(chatJid, quotedContent, { quoted: msg });
            }

            // Si no hay mensaje de argumentos ni mensaje citado, usar uno por defecto
            if (!message) {
                message = `📢 *Atención, grupo*`;
            }

            // Enviar el mensaje con menciones a todos los participantes
            await sock.sendMessage(chatJid, {
                text: message,
                mentions: participants
            });

            console.log(`[HIDETAG] ${userJid} usó hidetag en el grupo "${metadata.subject}"`);

        } catch (error) {
            console.error('[HIDETAG ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar enviar la notificación.' });
        }
    }
};