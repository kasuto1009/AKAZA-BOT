// commands/dado.js (VERSIÓN COMMONJS - SIN STICKERS, SOLO TEXTO MEJORADO)

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// Configuración del premio
const JACKPOT_NUMBER = 6;
const JACKPOT_REWARD = 50; // Monedas por sacar el número ganador

// Mapeo de resultados a emojis de dados para un mensaje más visual
const diceEmojiMap = {
    1: '1 ⚀',
    2: '2 ⚁',
    3: '3 ⚂',
    4: '4 ⚃',
    5: '5 ⚄',
    6: '6 ⚅'
};

module.exports = {
    name: 'dado',
    alias: ['roll', 'lanzar'],
    description: 'Lanza un dado virtual y gana monedas si sacas un 6.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // 1. Verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para jugar, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🎲 Lanzando el dado...' });

            // 2. Simular el lanzamiento del dado
            const rollResult = Math.floor(Math.random() * 6) + 1;
            
            // 3. Determinar el resultado y construir el mensaje final
            let finalMessage;

            if (rollResult === JACKPOT_NUMBER) {
                // ¡Premio mayor!
                DB.addCoins(userPhone, JACKPOT_REWARD);
                finalMessage = 
`💎 ━━━━━ ✦ ━━━━━ 💎
        *¡JACKPOT!* 🎉🥳
 
          Obtuviste un ${diceEmojiMap[rollResult]}
 
 ¡Felicidades! Has ganado el premio mayor de *${JACKPOT_REWARD} monedas* 🪙.
💎 ━━━━━ ✦ ━━━━━ 💎`;
            } else {
                // Resultado normal
                finalMessage = 
`🎲 ━━━━━ ✦ ━━━━━ 🎲
       *Lanzamiento de Dado*
 
          Obtuviste un ${diceEmojiMap[rollResult]}
 
 ¡Casi! Sigue intentando para ganar el premio mayor.
🎲 ━━━━━ ✦ ━━━━━ 🎲`;
            }

            // 4. Enviar el resultado al chat
            await sock.sendMessage(chatJid, { text: finalMessage });

        } catch (error) {
            console.error('[DADO COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al lanzar el dado.' });
        }
    }
};