// commands/clear.js (VERSIÓN "KATANA DEMONÍACA" - CON VERIFICACIÓN DE PERMISOS)

const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

// --- Función Helper para identificar al usuario objetivo ---
function getTargetJid(msg, args) {
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return msg.message.extendedTextMessage.contextInfo.participant;
    }
    const target = args[0]?.replace('@', '').replace(/\D/g, '');
    if (target) {
        return `${target}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name: 'clear',
    alias: ['limpiar'],
    description: 'Desata una técnica de purificación para limpiar los rastros de un guerrero.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, isGroup, store } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica de purificación solo puede ser ejecutada en el campo de batalla (grupos).' });
        }

        const targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            const usageMessage = 
`╪══════ 👹 ══════╪
     *~ Técnica Fallida ~*

Debes señalar a un objetivo para purificar sus rastros.

┫ *Ejemplo:*
┃   \`${PREFIX}clear @objetivo\`
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }

        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];

        try {
            // =================================================================
            // MEJORA: Se añade una verificación para asegurar que el bot sea admin.
            // =================================================================
            const metadata = await sock.groupMetadata(chatJid);
            const botJid = jidNormalizedUser(sock.user.id);
            const botParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);

            if (!botParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '👹 Para usar esta técnica, primero debo ser un Hashira (administrador) del grupo.' });
            }

            await sock.sendMessage(chatJid, { text: `👹 Iniciando técnica de purificación sobre @${targetPhone}... Sus rastros serán borrados.`, mentions: [targetJid] });

            const groupMessages = store.messages[chatJid];
            if (!groupMessages) {
                return sock.sendMessage(chatJid, { text: '✅ No hay rastros recientes en la memoria del bot para purificar.' });
            }

            const userMessageKeys = [];
            for (const messageId in groupMessages) {
                const message = groupMessages[messageId];
                const senderJid = jidNormalizedUser(message.key.participant || message.participant || message.key.remoteJid);

                if (senderJid === jidNormalizedUser(targetJid)) {
                    userMessageKeys.push(message.key);
                }
            }

            if (userMessageKeys.length === 0) {
                return sock.sendMessage(chatJid, { text: `✅ El objetivo @${targetPhone} no ha dejado rastros recientes para purificar.`, mentions: [targetJid] });
            }

            let deletedCount = 0;
            for (const key of userMessageKeys) {
                try {
                    await sock.sendMessage(chatJid, { delete: key });
                    deletedCount++;
                    await new Promise(resolve => setTimeout(resolve, 350));
                } catch (deleteError) {
                    console.error(`[CLEAR COMMAND] No se pudo purificar el rastro ${key.id} (probablemente muy antiguo).`);
                }
            }

            const finalMessage = 
`╪══════ 👹 ══════╪
     *~ Purificación Completada ~*

Se encontraron *${userMessageKeys.length}* rastros del guerrero @${targetPhone}.

Se purificaron con éxito *${deletedCount}* de ellos.
_(Los rastros más antiguos no pueden ser borrados)_

╪══════ •| ✧ |• ══════╪`;
            await sock.sendMessage(chatJid, { text: finalMessage, mentions: [targetJid] });

        } catch (error) {
            console.error('[CLEAR COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al ejecutar la técnica de purificación.' });
        }
    }
};