<<<<<<< HEAD
// commands/hidetag.js (VERSIÓN "KATANA DEMONÍACA" - INVOCACIÓN MASIVA)

=======
// commands/hidetag.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)

const DB = require('../core/db.js');
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'hidetag',
<<<<<<< HEAD
    alias: ['tag', 'notificar', 'todos', 'invocar'],
    description: 'Desata una técnica de invocación para llamar la atención de todos los guerreros del clan.',
    adminOnly: true,
=======
    alias: ['tag', 'notificar', 'ht', 'todos'],
    description: 'Menciona a todos los miembros del grupo en un mensaje.',
    adminOnly: true, // Indica que es un comando para administradores
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
<<<<<<< HEAD
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica de invocación solo puede ser ejecutada en el campo de batalla (grupos).' });
        }

        try {
            const metadata = await sock.groupMetadata(chatJid);
            const participants = metadata.participants;
            
            // --- CONSTRUCCIÓN DEL MENSAJE "ULTRA PREMIUM" ---

            // 1. Encabezado
            let finalMessage = 
`╪══════ 📣 ══════╪
     *~ LLAMADO A LAS FILAS ~*

*Clan:* ${metadata.subject}
*Guerreros:* ${participants.length}

╪════ •| ✧ |• ════╪\n`;

            // 2. Mensaje personalizado (si existe)
            const customMessage = args.join(' ').trim();
            if (customMessage) {
                finalMessage += `${customMessage}\n\n`;
            }

            // 3. Lista de Invocación
            const mentions = [];
            let userListText = '┌──⭓ *CONVOCADOS*\n';
            for (const participant of participants) {
                const userNumber = participant.id.split('@')[0];
                userListText += `┃ 👹 @${userNumber}\n`;
                mentions.push(participant.id);
            }
            userListText += '└───────⭓';
            
            finalMessage += userListText;

            // 4. Pie de página
            finalMessage += `\n\n*Invocado por:* @${userJid.split('@')[0]}
╪══════ 👹 ══════╪`;

            mentions.push(userJid); // Asegurarse de que el admin que invoca también sea mencionado si está en la lista

            // 5. Enviar el mensaje con la lista de menciones
            await sock.sendMessage(chatJid, {
                text: finalMessage,
                mentions: mentions
            });

        } catch (error) {
            console.error('[HIDETAG ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al ejecutar la técnica de invocación.' });
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};