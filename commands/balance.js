// commands/balance.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'balance',
    alias: ['bal', 'monedas', 'coins'],
    description: 'Consulta tu tesoro acumulado en el campo de batalla.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Para consultar tu tesoro, primero debes unirte a la batalla con *${PREFIX}registrar*.` });
        }

        try {
            const userCoins = user.coins || 0;

            // --- MENSAJE DE BALANCE ESTILO "KATANA DEMONIACA" ---
            const balanceMessage = 
`╪══════ 👹 ══════╪
    *~ Tesoro del Guerrero ~*

┫ 👤 *Guerrero:* ${user.alias || user.name}
┫ 🪙 *Monedas:* ${userCoins}

Continúa la batalla para amasar una fortuna mayor.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: balanceMessage });

        } catch (error) {
            console.error('[BALANCE COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar tu tesoro.' });
        }
    }
};