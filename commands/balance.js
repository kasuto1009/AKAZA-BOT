<<<<<<< HEAD
// commands/balance.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/balance.js (VERSIÓN COMMONJS)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

module.exports = {
    name: 'balance',
    alias: ['bal', 'monedas', 'coins'],
<<<<<<< HEAD
    description: 'Consulta tu tesoro acumulado en el campo de batalla.',
=======
    description: 'Muestra tu saldo actual de monedas.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

<<<<<<< HEAD
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
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

            await sock.sendMessage(chatJid, { text: balanceMessage });

        } catch (error) {
            console.error('[BALANCE COMMAND ERROR]', error);
<<<<<<< HEAD
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar tu tesoro.' });
=======
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar tu balance.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};