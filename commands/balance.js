// commands/balance.js (VERSIÓN COMMONJS)

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'balance',
    alias: ['bal', 'monedas', 'coins'],
    description: 'Muestra tu saldo actual de monedas.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // 1. Verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para ver tu balance, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        try {
            // 2. Obtener el saldo de monedas del usuario
            // Si la columna 'coins' aún no existe para un usuario viejo, se asume 0.
            const userCoins = user.coins || 0;

            // 3. Construir y enviar el mensaje de balance
            const balanceMessage = 
`🪙 ━━ ✦ *Balance* ✦ ━━━ 🪙

👤 *Usuario:* ${user.alias || user.name}
💰 *Monedas:* ${userCoins}

¡Sigue jugando para ganar más!
🪙 ━━━━━ ✦ ━━━━━ 🪙`;

            await sock.sendMessage(chatJid, { text: balanceMessage });

        } catch (error) {
            console.error('[BALANCE COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar tu balance.' });
        }
    }
};