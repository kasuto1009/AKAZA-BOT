<<<<<<< HEAD
// commands/tienda.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/tienda.js (VERSIÓN CON ECONOMÍA MEJORADA)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

<<<<<<< HEAD
// --- ARTEFACTOS DEL MERCADO NEGRO ---
const storeItems = {
    ia1: {
        name: '1 Pergamino de Sangre',
        description: 'Una consulta al Oráculo de Sangre.',
=======
// --- ARTÍCULOS DE LA TIENDA (CON PRECIOS EQUILIBRADOS Y PAQUETES) ---
const storeItems = {
    ia1: {
        name: '1 Crédito de IA',
        description: 'Un solo uso para el comando !ia.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        price: 150, // Costo en monedas
        credits: 1  // Créditos que otorga
    },
    ia10: {
<<<<<<< HEAD
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
=======
        name: 'Paquete de 10 Créditos de IA',
        description: 'Un paquete de 10 usos para el comando !ia.',
        price: 1200, // Ahorras 300 monedas (20% de descuento)
        credits: 10
    },
    ia20: {
        name: 'Paquete de 20 Créditos de IA',
        description: 'Un paquete de 20 usos para el comando !ia.',
        price: 2200, // Ahorras 800 monedas (~27% de descuento)
        credits: 20
    },
    ia50: {
        name: 'Paquete de 50 Créditos de IA',
        description: 'El paquete con el mejor valor, con 50 usos para el comando !ia.',
        price: 5000, // Ahorras 2500 monedas (~33% de descuento)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        credits: 50
    }
};

module.exports = {
    name: 'tienda',
<<<<<<< HEAD
    alias: ['store', 'comprar', 'mercado'],
    description: 'Accede al Mercado Negro del Clan para adquirir artefactos con tu tesoro.',
=======
    alias: ['store', 'comprar'],
    description: 'Compra artículos con las monedas que has ganado.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

<<<<<<< HEAD
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para acceder al Mercado Negro. Usa *${PREFIX}registrar*.` });
=======
        // 1. Verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar la tienda, primero debes registrarte con *${PREFIX}registrar*.` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }

        const command = args[0]?.toLowerCase();
        const itemKey = args[1]?.toLowerCase();

<<<<<<< HEAD
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

=======
        // 2. Si solo se usa `!tienda`, mostrar el menú
        if (!command) {
            const userCoins = user.coins || 0;
            let storeMessage = 
`🏪 ━━ ✦ *Tienda del Bot* ✦ ━━ 🏪

¡Usa tus monedas para comprar mejoras y créditos!

*Tu Saldo:* ${userCoins} monedas 🪙

*Artículos Disponibles:*
`;
            // Agrupamos los artículos por tipo para un menú más limpio
            storeMessage += `\n🤖 *Créditos de Inteligencia Artificial*`;
            for (const key in storeItems) {
                const item = storeItems[key];
                storeMessage += `
┌─ ✧ *${item.name}*
│  › *Precio:* ${item.price} monedas 🪙
└─ ✧ *Comando:* \`${PREFIX}tienda comprar ${key}\``;
            }
            storeMessage += `\n\n🏪 ━━━━━ ✦ ━━━━━ 🏪`;
            return sock.sendMessage(chatJid, { text: storeMessage });
        }

        // 3. Lógica para comprar
        if (command === 'comprar') {
            const item = storeItems[itemKey];
            if (!item) {
                return sock.sendMessage(chatJid, { text: `❌ El artículo "${itemKey}" no existe en la tienda.` });
            }

            if ((user.coins || 0) < item.price) {
                return sock.sendMessage(chatJid, { text: `💰 ¡Monedas insuficientes! Necesitas ${item.price} monedas y solo tienes ${user.coins || 0}.` });
            }

            // Realizar la transacción
            DB.removeCoins(userPhone, item.price);
            DB.addIaCredits(userPhone, item.credits);

            // Volvemos a leer los datos del usuario para obtener los valores actualizados
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            const updatedUser = DB.getUserByPhone(userPhone);
            const newCoins = updatedUser.coins || 0;
            const newCredits = updatedUser.ia_credits || 0;

            const successMessage = 
<<<<<<< HEAD
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
=======
`✅ ¡Compra exitosa!

*Artículo:* ${item.name}
*Costo:* ${item.price} monedas 🪙
*Créditos obtenidos:* ${item.credits} 🤖

*Tu nuevo balance:*
💰 Monedas: ${newCoins}
🤖 Créditos de IA: ${newCredits}`;
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

            return sock.sendMessage(chatJid, { text: successMessage });
        }

<<<<<<< HEAD
        return sock.sendMessage(chatJid, { text: `Técnica no reconocida. Usa *${PREFIX}tienda* para ver los artefactos o *${PREFIX}tienda comprar <artefacto>* para adquirir uno.` });
=======
        // Si el comando no es válido
        return sock.sendMessage(chatJid, { text: `Comando no reconocido. Usa *${PREFIX}tienda* para ver los artículos o *${PREFIX}tienda comprar <articulo>* para comprar.` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    }
};