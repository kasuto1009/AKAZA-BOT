// commands/registrar-grupo.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'registrar-grupo',
    alias: ['activar-bot', 'setup-group'],
    description: 'Forja un Pacto de Sangre para registrar y activar el bot en este clan.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica de pacto solo puede ser ejecutada en un campo de batalla (grupo).' });
        }

        try {
            const metadata = await sock.groupMetadata(chatJid);
            const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));

            if (!userParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '👹 Solo un Hashira puede forjar un pacto en nombre del clan.' });
            }

            DB.registerGroup(chatJid, metadata.subject);
            
            const successMessage =
`╪══════ 👹 ══════╪
    *~ Pacto de Sangre Sellado ~*

¡El pacto con el clan *${metadata.subject}* ha sido forjado!

El bot ahora reconocerá este dominio y responderá al llamado de sus guerreros.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: successMessage });

        } catch (error) {
            console.error('[REGISTRAR-GRUPO ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar forjar el pacto con el clan.' });
        }
    }
};