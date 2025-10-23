// commands/block-system.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

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

// --- COMANDO DE BLOQUEO ---
const blockCommand = {
    name: 'block',
    alias: ['bloquear'],
    description: 'Aplica un sello de contención a un usuario para silenciar sus técnicas.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo funciona en el campo de batalla (grupos).' });
        }

        const targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            const usageMessage = 
`╪══════ 👹 ══════╪
    *~ Técnica Fallida ~*

Debes señalar a un objetivo para aplicar el sello.

┫ *Ejemplo:*
┃   \`${PREFIX}block @objetivo\`
╪═══════ •| ✧ |• ═══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }
        
        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];

        try {
            const metadata = await sock.groupMetadata(chatJid);
            const targetParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(targetJid));
            
            if (targetJid === OWNER_NUMBER || targetParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '👹 Un Hashira o una Luna Superior no pueden ser sellados.' });
            }

            const result = DB.blockUserInGroup(chatJid, targetPhone, userJid);

            if (result.changes > 0) {
                const successMessage = 
`╪══════ 👹 ══════╪
    *~ Sello de Contención Aplicado ~*

El objetivo @${targetPhone} ha sido sellado.

Sus técnicas (comandos) han sido silenciadas en este campo de batalla.
╪═══════ •| ✧ |• ═══════╪`;
                await sock.sendMessage(chatJid, { text: successMessage, mentions: [targetJid] });
            } else {
                await sock.sendMessage(chatJid, { text: `👹 El objetivo @${targetPhone} ya se encuentra bajo un sello de contención.`, mentions: [targetJid] });
            }

        } catch (error) {
            console.error('[BLOCK COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar aplicar el sello.' });
        }
    }
};

// --- COMANDO DE DESBLOQUEO ---
const unblockCommand = {
    name: 'unblock',
    alias: ['desbloquear'],
    description: 'Libera a un usuario del sello de contención.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo funciona en el campo de batalla (grupos).' });
        }

        const targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            const usageMessage = 
`╪══════ 👹 ══════╪
    *~ Técnica Fallida ~*

Debes señalar a un objetivo para romper el sello.

┫ *Ejemplo:*
┃   \`${PREFIX}unblock @objetivo\`
╪═══════ •| ✧ |• ═══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }
        
        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];

        try {
            const result = DB.unblockUserInGroup(chatJid, targetPhone);

            if (result.changes > 0) {
                const successMessage = 
`╪══════ 👹 ══════╪
    *~ Sello Roto ~*

El sello de contención sobre @${targetPhone} ha sido destruido.

Sus técnicas (comandos) han sido restauradas.
╪═══════ •| ✧ |• ═══════╪`;
                await sock.sendMessage(chatJid, { text: successMessage, mentions: [targetJid] });
            } else {
                await sock.sendMessage(chatJid, { text: `👹 El objetivo @${targetPhone} no se encontraba bajo ningún sello.`, mentions: [targetJid] });
            }

        } catch (error) {
            console.error('[UNBLOCK COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar romper el sello.' });
        }
    }
};

// --- COMANDO PARA LISTAR BLOQUEADOS ---
const blocklistCommand = {
    name: 'blocklist',
    alias: ['listablock'],
    description: 'Muestra el pergamino de todos los sellos de contención activos.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo funciona en el campo de batalla (grupos).' });
        }

        try {
            const blockedUsers = DB.getBlockedUsersInGroup(chatJid);

            if (!blockedUsers || blockedUsers.length === 0) {
                return sock.sendMessage(chatJid, { text: '✅ El campo de batalla está libre de sellos de contención.' });
            }

            let listMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino de Sellos ~*\n\n`;
            let mentions = [];
            for (const [index, user] of blockedUsers.entries()) {
                const blockedByAdminData = DB.getUserByPhone(user.blocked_by);
                const blockedByAlias = blockedByAdminData?.alias || user.blocked_by;
                const date = new Date(user.timestamp).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
                
                listMessage += `*${index + 1})* @${user.user_phone}\n   › *Sellado por:* ${blockedByAlias}\n   › *Fecha:* ${date}\n\n`;
                mentions.push(`${user.user_phone}@s.whatsapp.net`);
            }
            listMessage += '╪══════ •| ✧ |• ══════╪';

            await sock.sendMessage(chatJid, { text: listMessage, mentions: mentions });

        } catch (error) {
            console.error('[BLOCKLIST COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar el pergamino de sellos.' });
        }
    }
};

// Exportamos todos los comandos desde el mismo archivo
module.exports = {
    block: blockCommand,
    unblock: unblockCommand,
    blocklist: blocklistCommand
};