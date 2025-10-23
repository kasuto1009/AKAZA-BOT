// commands/admin-group.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

// --- FUNCIÓN HELPER MEJORADA ---
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

// --- FUNCIÓN HELPER CENTRALIZADA "KATANA DEMONIACA" ---
async function groupActionHandler(sock, msg, args, ctx, action) {
    const { chatJid, userJid, isGroup } = ctx;
    
    const botJid = jidNormalizedUser(sock.user.id);

    if (!isGroup) {
        return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo puede ser ejecutada en el campo de batalla (grupos).' });
    }

    try {
        const metadata = await sock.groupMetadata(chatJid);
        const participants = metadata.participants;

        const botParticipant = participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);
        if (!botParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '👹 Debo tener el rango de Hashira (admin) para ejecutar esta orden.' });
        }

        const userParticipant = participants.find(p => jidNormalizedUser(p.id) === userJid || jidNormalizedUser(p.jid) === userJid);
        if (!userParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '🚫 Solo los Hashira (admins) de este grupo pueden desatar esta técnica.' });
        }

        let targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            return sock.sendMessage(chatJid, { text: `👹 Debes señalar a tu objetivo para ejecutar la técnica.\nEj: \`${PREFIX}${action} @objetivo\`` });
        }
        targetJid = jidNormalizedUser(targetJid);

        if (targetJid === botJid) return sock.sendMessage(chatJid, { text: '👹 Un demonio no puede usar su propia técnica en sí mismo.' });
        if (targetJid === userJid) return sock.sendMessage(chatJid, { text: '👹 No puedes usar esta técnica en ti mismo.' });

        const targetParticipant = participants.find(p => jidNormalizedUser(p.id) === targetJid || jidNormalizedUser(p.jid) === targetJid);
        if (!targetParticipant) {
             return sock.sendMessage(chatJid, { text: '👹 El objetivo no se encuentra en este campo de batalla.' });
        }

        if (targetParticipant?.admin && (action === 'remove' || action === 'promote')) {
            return sock.sendMessage(chatJid, { text: '👹 Un Hashira no puede ser desterrado ni ascendido. Primero degrádalo.' });
        }

        // --- MENSAJES TEMÁTICOS "KATANA DEMONIACA" ---
        const actionMessages = {
            remove: { verb: 'Desterrar', past: 'desterrado del grupo' },
            promote: { verb: 'Ascender', past: 'ascendido al rango de Hashira (admin)' },
            demote: { verb: 'Degradar', past: 'degradado al rango de Mizunoto (miembro)' }
        };
        const message = actionMessages[action];

        await sock.groupParticipantsUpdate(chatJid, [targetJid], action);
        
        const confirmationMessage = 
`╪══════ 👹 ══════╪
    *~ Técnica Ejecutada ~*

✅ El objetivo @${targetJid.split('@')[0]} ha sido ${message.past}.
╪══════ •| ✧ |• ══════╪`;

        await sock.sendMessage(chatJid, { 
            text: confirmationMessage, 
            mentions: [targetJid] 
        });

    } catch (error) {
        console.error(`[ERROR EN ${action.toUpperCase()}]`, error);
        await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al desatar la Técnica de Sangre.` });
    }
}

// --- EXPORTAMOS LOS TRES COMANDOS CON ESTILO ---
module.exports = {
    kick: {
        name: 'kick',
        alias: ['expulsar', 'sacar', 'ban'],
        description: 'Ejecuta un destierro sobre un miembro del grupo.',
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'remove')
    },
    promote: {
        name: 'promote',
        alias: ['admin', 'daradmin', 'ad'],
        description: 'Asciende a un miembro al rango de Hashira (admin).',
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'promote')
    },
    demote: {
        name: 'demote',
        alias: ['unadmin', 'quitaradmin', 'unban'],
        description: 'Degrada a un Hashira al rango de Mizunoto (miembro).',
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'demote')
    }
};