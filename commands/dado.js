// commands/dado.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// Configuración del premio
const JACKPOT_NUMBER = 6;
const JACKPOT_REWARD = 50; // Tesoro por obtener la marca del destino

// Mapeo de resultados a emojis de dados
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
    description: 'Desafía tu suerte y pon a prueba tu destino para obtener un tesoro.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

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

            await sock.sendMessage(chatJid, { text: finalMessage });

        } catch (error) {
            console.error('[DADO COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar al destino.' });
        }
    }
};