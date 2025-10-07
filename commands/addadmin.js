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
};