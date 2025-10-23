<<<<<<< HEAD
// commands/admin-group.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/admin-group.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

// --- FUNCIÓN HELPER MEJORADA ---
<<<<<<< HEAD
=======
// Para identificar al usuario objetivo de múltiples maneras (mención, respuesta, número)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
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

<<<<<<< HEAD
// --- FUNCIÓN HELPER CENTRALIZADA "KATANA DEMONIACA" ---
async function groupActionHandler(sock, msg, args, ctx, action) {
    const { chatJid, userJid, isGroup } = ctx;
    
    const botJid = jidNormalizedUser(sock.user.id);

    if (!isGroup) {
        return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo puede ser ejecutada en el campo de batalla (grupos).' });
=======
// --- FUNCIÓN HELPER CENTRALIZADA ---
// Contiene toda la lógica repetitiva para los comandos de admin
async function groupActionHandler(sock, msg, args, ctx, action) {
    const { chatJid, userJid, isGroup } = ctx;
    
    // El JID del bot se obtiene del socket conectado y se normaliza.
    const botJid = jidNormalizedUser(sock.user.id);

    if (!isGroup) {
        return sock.sendMessage(chatJid, { text: '❌ Este comando solo funciona en grupos.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    }

    try {
        const metadata = await sock.groupMetadata(chatJid);
        const participants = metadata.participants;

<<<<<<< HEAD
        const botParticipant = participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);
        if (!botParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '👹 Debo tener el rango de Hashira (admin) para ejecutar esta orden.' });
        }

        const userParticipant = participants.find(p => jidNormalizedUser(p.id) === userJid || jidNormalizedUser(p.jid) === userJid);
        if (!userParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '🚫 Solo los Hashira (admins) de este grupo pueden desatar esta técnica.' });
=======
        // =================================================================
        // CORRECCIÓN: Verificación de admin robusta para el BOT
        // Se busca al bot por su JID en las propiedades 'id' y 'jid' del participante.
        // =================================================================
        const botParticipant = participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);
        if (!botParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '❌ Necesito ser administrador del grupo para hacer eso.' });
        }

        // Esta verificación ya está corregida en index.js, pero la mantenemos aquí por seguridad.
        const userParticipant = participants.find(p => jidNormalizedUser(p.id) === userJid || jidNormalizedUser(p.jid) === userJid);
        if (!userParticipant?.admin) {
            return sock.sendMessage(chatJid, { text: '🚫 Solo los administradores de este grupo pueden usar este comando.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }

        let targetJid = getTargetJid(msg, args);
        if (!targetJid) {
<<<<<<< HEAD
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
=======
            return sock.sendMessage(chatJid, { text: `❌ Debes responder al mensaje de un usuario, mencionarlo o proporcionar su número.\nEj: \`${PREFIX}${action} @usuario\`` });
        }
        targetJid = jidNormalizedUser(targetJid); // Normalizamos el JID del objetivo

        if (targetJid === botJid) return sock.sendMessage(chatJid, { text: '❌ No puedo realizar esa acción sobre mí mismo.' });
        if (targetJid === userJid) return sock.sendMessage(chatJid, { text: '❌ No puedes realizar esa acción sobre ti mismo.' });

        const targetParticipant = participants.find(p => jidNormalizedUser(p.id) === targetJid || jidNormalizedUser(p.jid) === targetJid);
        if (!targetParticipant) {
             return sock.sendMessage(chatJid, { text: '❌ El usuario objetivo no se encuentra en este grupo.' });
        }

        if (targetParticipant?.admin && (action === 'remove' || action === 'promote')) {
            return sock.sendMessage(chatJid, { text: '❌ No puedes expulsar o promover a alguien que ya es administrador.' });
        }

        const actionMessages = {
            remove: { verb: 'expulsar', past: 'expulsado' },
            promote: { verb: 'promover', past: 'promovido a administrador' },
            demote: { verb: 'degradar', past: 'degradado a miembro' }
        };
        const message = actionMessages[action];

        // Se elimina el mensaje "Intentando..." y se realiza la acción directamente.
        await sock.groupParticipantsUpdate(chatJid, [targetJid], action);

        // Se mantiene únicamente el mensaje de confirmación final.
        await sock.sendMessage(chatJid, { 
            text: `✅ @${targetJid.split('@')[0]} ha sido ${message.past}.`, 
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            mentions: [targetJid] 
        });

    } catch (error) {
        console.error(`[ERROR EN ${action.toUpperCase()}]`, error);
<<<<<<< HEAD
        await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al desatar la Técnica de Sangre.` });
    }
}

// --- EXPORTAMOS LOS TRES COMANDOS CON ESTILO ---
module.exports = {
    kick: {
        name: 'kick',
        alias: ['expulsar', 'sacar', 'ban'],
        description: 'Ejecuta un destierro sobre un miembro del grupo.',
=======
        await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error al intentar realizar la acción.` });
    }
}

// --- EXPORTAMOS LOS TRES COMANDOS ---
module.exports = {
    kick: {
        name: 'kick',
        alias: ['expulsar', 'sacar'],
        description: 'Expulsa a un usuario del grupo.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'remove')
    },
    promote: {
        name: 'promote',
<<<<<<< HEAD
        alias: ['admin', 'daradmin', 'ad'],
        description: 'Asciende a un miembro al rango de Hashira (admin).',
=======
        alias: ['admin', 'daradmin'],
        description: 'Promueve a un usuario a administrador.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'promote')
    },
    demote: {
        name: 'demote',
<<<<<<< HEAD
        alias: ['unadmin', 'quitaradmin', 'unban'],
        description: 'Degrada a un Hashira al rango de Mizunoto (miembro).',
=======
        alias: ['unadmin', 'quitaradmin'],
        description: 'Degrada a un administrador a miembro.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        adminOnly: true,
        execute: (sock, msg, args, ctx) => groupActionHandler(sock, msg, args, ctx, 'demote')
    }
};