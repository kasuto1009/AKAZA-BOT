// commands/listadmins.js (VERSIÓN "KATANA DEMONIACA")

const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'listadmins',
    alias: ['admins', 'administradores'],
    description: 'Revela el pergamino sagrado de los Hashira que lideran este clan.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Este pergamino solo puede ser leído en el campo de batalla (grupos).' });
        }

        try {
            const metadata = await sock.groupMetadata(chatJid);
            const admins = metadata.participants.filter(p => p.admin);

            if (!admins || admins.length === 0) {
                return sock.sendMessage(chatJid, { text: 'ℹ️ Este clan aún no tiene Hashira que lo lideren.' });
            }

            // --- PERGAMINO DE HASHIRAS ESTILO "KATANA DEMONIACA" ---
            let adminListMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino de Hashiras ~*

┫ *Clan:* ${metadata.subject}\n\n`;
            let mentions = [];

            admins.forEach((admin, index) => {
                const userJid = jidNormalizedUser(admin.id);
                // Determinamos el rango del guerrero
                const role = admin.admin === 'superadmin' ? 'Líder del Clan ✨' : 'Hashira 🛡️';
                
                adminListMessage += `┫ *${index + 1})* @${userJid.split('@')[0]}\n┃   › *Rango:* ${role}\n\n`;
                mentions.push(userJid);
            });

            adminListMessage += `*Total:* ${admins.length} Hashira(s) al mando.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, {
                text: adminListMessage,
                mentions: mentions
            });

        } catch (error) {
            console.error('[LISTADMINS COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar leer el pergamino de Hashiras.' });
        }
    }
};