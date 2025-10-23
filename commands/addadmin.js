<<<<<<< HEAD
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
=======
// commands/addadmin.js (VERSIÓN COMMONJS - CORREGIDA Y MEJORADA)

const DB = require('../core/db');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER; // Formato JID: 593...@s.whatsapp.net

module.exports = {
    name: 'addadmin',
    alias: ['newadmin', 'daradminbot'],
    description: 'Agrega a un usuario como administrador del bot (solo owner).',
    public: false, // Este comando no es público

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, prefix } = ctx;

        // 1. Verificamos si la persona que ejecuta el comando es el OWNER
        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '🔒 Este comando es exclusivo para el dueño (owner) del bot.' });
        }

        // 2. Lógica mejorada para identificar al usuario objetivo
        let targetJid;
        const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quotedUser = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const numberArg = args[0]?.replace(/\D/g, '');

        if (mentionedJid) {
            targetJid = mentionedJid;
        } else if (quotedUser) {
            targetJid = quotedUser;
        } else if (numberArg) {
            targetJid = `${numberArg}@s.whatsapp.net`;
        } else {
            return sock.sendMessage(chatJid, { text: `⚠️ Uso incorrecto.\nEjemplo:\n• ${prefix}addadmin @usuario\n• ${prefix}addadmin (respondiendo a un mensaje)\n• ${prefix}addadmin 593...` });
        }

        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];

        // 3. Verificamos que el usuario objetivo esté registrado
        const targetUser = DB.getUserByPhone(targetPhone);
        if (!targetUser) {
            return sock.sendMessage(chatJid, { text: `❌ No se puede hacer admin a @${targetPhone}, ya que no está registrado en el bot.\n\nPídele que se registre primero con el comando *${prefix}registrar*.`, mentions: [targetJid] });
        }
        
        // 4. Verificamos si ya es admin
        if (targetUser.is_admin) {
            return sock.sendMessage(chatJid, { text: `ℹ️ El usuario @${targetPhone} ya es un administrador del bot.`, mentions: [targetJid] });
        }

        // 5. Llamamos a la función de la base de datos para agregar el rol
        const result = DB.addAdmin(targetPhone);

        // 6. Enviamos el mensaje de confirmación
        if (result.changes > 0) {
            return sock.sendMessage(chatJid, { text: `✅ ¡Éxito! @${targetPhone} ha sido agregado como administrador del bot.`, mentions: [targetJid] });
        } else {
            return sock.sendMessage(chatJid, { text: `❌ Ocurrió un error inesperado al intentar agregar a @${targetPhone} como admin.`, mentions: [targetJid] });
        }
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};