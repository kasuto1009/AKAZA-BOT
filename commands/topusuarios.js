// commands/topusuarios.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'topusuarios',
    alias: ['top', 'ranking'],
    description: 'Muestra el Pergamino de Leyendas con los 5 guerreros más honorables.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        const user = DB.getUserByPhone(userJid.split('@')[0]);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para consultar el Pergamino de Leyendas. Usa *${PREFIX}registrar*.` });
        }

        try {
            const topUsers = DB.getTopUsersByMessages(5);

            if (!topUsers || topUsers.length === 0) {
                return sock.sendMessage(chatJid, { text: '📊 El pergamino aún está en blanco. ¡Luchen para inscribir sus nombres!' });
            }

            const medals = ['🥇', '🥈', '🥉', '4.', '5.'];

            // --- PERGAMINO DE LEYENDAS ESTILO "KATANA DEMONIACA" ---
            let rankingMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino de Leyendas ~*

Aquí se inscribe el honor de los guerreros más poderosos del clan:\n
`;

            topUsers.forEach((topUser, index) => {
                rankingMessage += `┫ ${medals[index]} *${topUser.alias}*\n┃   › *Hazañas:* ${topUser.message_count}\n\n`;
            });

            rankingMessage += `¡Sigue luchando para forjar tu propia leyenda!
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: rankingMessage });

        } catch (error) {
            console.error('[TOPUSUARIOS COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar leer el Pergamino de Leyendas.' });
        }
    }
};