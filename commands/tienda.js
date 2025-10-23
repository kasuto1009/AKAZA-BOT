// commands/tienda.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// --- ARTEFACTOS DEL MERCADO NEGRO ---
const storeItems = {
    ia1: {
        name: '1 Pergamino de Sangre',
        description: 'Una consulta al Oráculo de Sangre.',
        price: 150, // Costo en monedas
        credits: 1  // Créditos que otorga
    },
    ia10: {
        name: 'Paquete de 10 Pergaminos de Sangre',
        description: 'Un paquete de 10 consultas al Oráculo de Sangre.',
        price: 1200, // Ahorras 300 monedas
        credits: 10
    },
    ia20: {
        name: 'Paquete de 20 Pergaminos de Sangre',
        description: 'Un paquete de 20 consultas al Oráculo de Sangre.',
        price: 2200, // Ahorras 800 monedas
        credits: 20
    },
    ia50: {
        name: 'Reserva del Sabio (50 Pergaminos)',
        description: 'La reserva definitiva para el buscador de conocimiento.',
        price: 5000, // Ahorras 2500 monedas
        credits: 50
    }
};

module.exports = {
    name: 'tienda',
    alias: ['store', 'comprar', 'mercado'],
    description: 'Accede al Mercado Negro del Clan para adquirir artefactos con tu tesoro.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para acceder al Mercado Negro. Usa *${PREFIX}registrar*.` });
        }

        const command = args[0]?.toLowerCase();
        const itemKey = args[1]?.toLowerCase();

        if (!command) {
            const userCoins = user.coins || 0;
            let storeMessage = 
`╪══════ 👹 ══════╪
    *~ Mercado Negro del Clan ~*

Intercambia tu tesoro por artefactos de poder.

┫ *Tu Tesoro:* ${userCoins} monedas 🪙
╪═══════ •| ✧ |• ═══════╪

    *~ Pergaminos de Sangre ~*
`;
            for (const key in storeItems) {
                const item = storeItems[key];
                storeMessage += `
┫ *${item.name}*
┃   › *Costo:* ${item.price} monedas 🪙
┃   › *Técnica:* \`${PREFIX}tienda comprar ${key}\`
`;
            }
            storeMessage += `\n╪═══════ •| ✧ |• ═══════╪`;
            return sock.sendMessage(chatJid, { text: storeMessage });
        }

        if (command === 'comprar') {
            const item = storeItems[itemKey];
            if (!item) {
                return sock.sendMessage(chatJid, { text: `❌ El artefacto "${itemKey}" no existe en el Mercado Negro.` });
            }

            if ((user.coins || 0) < item.price) {
                return sock.sendMessage(chatJid, { text: `💰 ¡Tesoro insuficiente! Necesitas ${item.price} monedas y solo posees ${user.coins || 0}.` });
            }

            DB.removeCoins(userPhone, item.price);
            DB.addIaCredits(userPhone, item.credits);

            const updatedUser = DB.getUserByPhone(userPhone);
            const newCoins = updatedUser.coins || 0;
            const newCredits = updatedUser.ia_credits || 0;

            const successMessage = 
`╪══════ 👹 ══════╪
    *~ Artefacto Adquirido ~*

✅ Has forjado un pacto exitoso.

┫ *Artefacto:* ${item.name}
┫ *Costo:* ${item.price} monedas 🪙
┫ *Poder Obtenido:* ${item.credits} 🔮

*Tu nuevo balance:*
┫ 💰 *Tesoro:* ${newCoins}
┫ 🔮 *Pergaminos:* ${newCredits}
╪══════ •| ✧ |• ══════╪`;

            return sock.sendMessage(chatJid, { text: successMessage });
        }

        return sock.sendMessage(chatJid, { text: `Técnica no reconocida. Usa *${PREFIX}tienda* para ver los artefactos o *${PREFIX}tienda comprar <artefacto>* para adquirir uno.` });
    }
};