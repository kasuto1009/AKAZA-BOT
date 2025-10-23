// commands/hidetag.js (VERSIÓN "KATANA DEMONÍACA" - INVOCACIÓN MASIVA)

const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'hidetag',
    alias: ['tag', 'notificar', 'todos', 'invocar'],
    description: 'Desata una técnica de invocación para llamar la atención de todos los guerreros del clan.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
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
        }
    }
};