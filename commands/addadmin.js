// commands/admin-bot.js (VERSIÓN "ULTRA PREMIUM" - SISTEMA DE ADMINS UNIFICADO)

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

// --- COMANDO PARA AÑADIR ADMINS ---
const addAdminCommand = {
    name: 'addadmin',
    alias: [],
    description: 'Añade a un usuario como administrador del bot (solo owner).',
    public: false,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '🔒 Este comando es exclusivo para el dueño del bot.' });
        }

        let targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            return sock.sendMessage(chatJid, { text: `⚠️ *Uso incorrecto.*\nDebes mencionar a un usuario, responder a su mensaje o escribir su número.\n\n*Ejemplo:* ${PREFIX}addadmin @usuario` });
        }

        // =================================================================
        // CORRECCIÓN: Lógica para resolver LID a JID cuando se menciona.
        // Esto es necesario por las actualizaciones de privacidad de WhatsApp.
        // =================================================================
        if (isGroup && targetJid.endsWith('@lid')) {
            try {
                const groupMetadata = await sock.groupMetadata(chatJid);
                const participant = groupMetadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
                if (participant && participant.jid) {
                    targetJid = jidNormalizedUser(participant.jid); // JID resuelto
                } else {
                    return sock.sendMessage(chatJid, { text: `❌ No se pudo resolver la mención del usuario en este grupo. Intenta usando su número.` });
                }
            } catch (e) {
                console.error("Error resolviendo LID en addadmin:", e);
                return sock.sendMessage(chatJid, { text: `❌ Ocurrió un error interno al procesar la mención.` });
            }
        }

        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];
        const targetUser = DB.getUserAny(targetPhone);

        if (!targetUser) {
            return sock.sendMessage(chatJid, { text: `❌ No se puede hacer admin a @${targetPhone}, ya que no está registrado.`, mentions: [targetJid] });
        }
        
        if (targetUser.is_admin) {
            return sock.sendMessage(chatJid, { text: `ℹ️ El usuario @${targetPhone} ya es un administrador.`, mentions: [targetJid] });
        }

        DB.addAdmin(targetPhone);
        
        const successMessage = 
`╪══════ 👑 ══════╪
     *NUEVO ADMINISTRADOR*
     *~ Técnica de Sangre ~*

El usuario @${targetPhone} ahora tiene privilegios de administrador del bot.

╪═══════════ 👹 ═══════════╪`;
        await sock.sendMessage(chatJid, { text: successMessage, mentions: [targetJid] });
    }
};

// --- COMANDO PARA QUITAR ADMINS ---
const delAdminCommand = {
    name: 'deladmin',
    alias: [],
    description: 'Quita los privilegios de administrador del bot a un usuario (solo owner).',
    public: false,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '🔒 Este comando es exclusivo para el dueño del bot.' });
        }

        let targetJid = getTargetJid(msg, args);
        if (!targetJid) {
            return sock.sendMessage(chatJid, { text: `⚠️ *Uso incorrecto.*\n*Ejemplo:* ${PREFIX}deladmin @usuario` });
        }

        // =================================================================
        // CORRECCIÓN: Lógica para resolver LID a JID cuando se menciona.
        // =================================================================
        if (isGroup && targetJid.endsWith('@lid')) {
            try {
                const groupMetadata = await sock.groupMetadata(chatJid);
                const participant = groupMetadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid));
                if (participant && participant.jid) {
                    targetJid = jidNormalizedUser(participant.jid); // JID resuelto
                } else {
                    return sock.sendMessage(chatJid, { text: `❌ No se pudo resolver la mención del usuario en este grupo. Intenta usando su número.` });
                }
            } catch (e) {
                console.error("Error resolviendo LID en deladmin:", e);
                return sock.sendMessage(chatJid, { text: `❌ Ocurrió un error interno al procesar la mención.` });
            }
        }

        if (jidNormalizedUser(targetJid) === jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '❌ No puedes quitarte los privilegios de dueño a ti mismo.' });
        }

        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];
        const targetUser = DB.getUserAny(targetPhone);

        if (!targetUser || !targetUser.is_admin) {
            return sock.sendMessage(chatJid, { text: `ℹ️ El usuario @${targetPhone} no es un administrador.`, mentions: [targetJid] });
        }
        
        DB.delAdmin(targetPhone);

        const successMessage = 
`╪══════ 🛡️ ══════╪
     *ADMINISTRADOR REMOVIDO*
     *~ Técnica de Sangre ~*

Se han revocado los privilegios de administrador del bot para @${targetPhone}.

╪══════ 👹 ══════╪`;
        await sock.sendMessage(chatJid, { text: successMessage, mentions: [targetJid] });
    }
};

// --- COMANDO PARA LISTAR ADMINS ---
const adminListCommand = {
    name: 'adminlist',
    alias: ['listadminsbot'],
    description: 'Muestra la lista de administradores del bot (solo owner).',
    public: false,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '🔒 Este comando es solo para el dueño del bot.' });
        }

        const ownerData = DB.getUserByPhone(OWNER_NUMBER.split('@')[0]);
        const admins = DB.getBotAdmins();

        let listMessage = 
`╪══════ 👑 ══════╪
     *LISTA DE ADMINISTRADORES*
     *~Técnica de Sangre~*

`;
        
        // Siempre mostrar al dueño primero
        listMessage += `┫ 👹 *Dueño (Owner):*\n┃ ╰─ ${ownerData?.alias || OWNER_NUMBER.split('@')[0]}\n\n`;
        
        if (admins && admins.length > 0) {
            listMessage += `┫ 🛡️ *Administradores:*\n`;
            admins.forEach(admin => {
                listMessage += `┃ ╰─ ${admin.alias || admin.user_phone}\n`;
            });
        } else {
            listMessage += `No hay otros administradores registrados.`;
        }

        listMessage += '\n╪═══════════ 👹 ═══════════╪';

        await sock.sendMessage(chatJid, { text: listMessage });
    }
};


// Exportamos todos los comandos desde el mismo archivo
module.exports = {
    addadmin: addAdminCommand,
    deladmin: delAdminCommand,
    adminlist: adminListCommand
};