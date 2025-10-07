// commands/tienda.js (VERSIÓN CON ECONOMÍA MEJORADA)

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// --- ARTÍCULOS DE LA TIENDA (CON PRECIOS EQUILIBRADOS Y PAQUETES) ---
const storeItems = {
    ia1: {
        name: '1 Crédito de IA',
        description: 'Un solo uso para el comando !ia.',
        price: 150, // Costo en monedas
        credits: 1  // Créditos que otorga
    },
    ia10: {
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
        credits: 50
    }
};

module.exports = {
    name: 'tienda',
    alias: ['store', 'comprar'],
    description: 'Compra artículos con las monedas que has ganado.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // 1. Verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para usar la tienda, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        const command = args[0]?.toLowerCase();
        const itemKey = args[1]?.toLowerCase();

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
            const updatedUser = DB.getUserByPhone(userPhone);
            const newCoins = updatedUser.coins || 0;
            const newCredits = updatedUser.ia_credits || 0;

            const successMessage = 
`✅ ¡Compra exitosa!

*Artículo:* ${item.name}
*Costo:* ${item.price} monedas 🪙
*Créditos obtenidos:* ${item.credits} 🤖

*Tu nuevo balance:*
💰 Monedas: ${newCoins}
🤖 Créditos de IA: ${newCredits}`;

            return sock.sendMessage(chatJid, { text: successMessage });
        }

        // Si el comando no es válido
        return sock.sendMessage(chatJid, { text: `Comando no reconocido. Usa *${PREFIX}tienda* para ver los artículos o *${PREFIX}tienda comprar <articulo>* para comprar.` });
    }
};