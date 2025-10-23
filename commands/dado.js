<<<<<<< HEAD
// commands/dado.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/dado.js (VERSIÓN COMMONJS - SIN STICKERS, SOLO TEXTO MEJORADO)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// Configuración del premio
const JACKPOT_NUMBER = 6;
<<<<<<< HEAD
const JACKPOT_REWARD = 50; // Tesoro por obtener la marca del destino

// Mapeo de resultados a emojis de dados
=======
const JACKPOT_REWARD = 50; // Monedas por sacar el número ganador

// Mapeo de resultados a emojis de dados para un mensaje más visual
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
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
<<<<<<< HEAD
    description: 'Desafía tu suerte y pon a prueba tu destino para obtener un tesoro.',
=======
    description: 'Lanza un dado virtual y gana monedas si sacas un 6.',
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

<<<<<<< HEAD
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para desafiar al destino. Usa *${PREFIX}registrar*.` });
        }

        try {
            await sock.sendMessage(chatJid, { text: '🎲 El destino está en juego...' });

            const rollResult = Math.floor(Math.random() * 6) + 1;
            
            let finalMessage;

            if (rollResult === JACKPOT_NUMBER) {
                DB.addCoins(userPhone, JACKPOT_REWARD);
                finalMessage = 
`╪══════ 👹 ══════╪
    *~ ¡Fortuna Celestial! ~*

        Has obtenido un ${diceEmojiMap[rollResult]}

¡Los cielos te sonríen! Has sido recompensado con un tesoro de *${JACKPOT_REWARD} monedas* 🪙.
╪══════ •| ✧ |• ══════╪`;
            } else {
                finalMessage = 
`╪══════ 👹 ══════╪
    *~ El Destino ha Hablado ~*

        Has obtenido un ${diceEmojiMap[rollResult]}

¡Casi! La fortuna favorece a los perseverantes.
╪══════ •| ✧ |• ══════╪`;
            }

=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            await sock.sendMessage(chatJid, { text: finalMessage });

        } catch (error) {
            console.error('[DADO COMMAND ERROR]', error);
<<<<<<< HEAD
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar al destino.' });
=======
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al lanzar el dado.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};