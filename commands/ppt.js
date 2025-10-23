// commands/ppt.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// Definimos las técnicas y sus debilidades
const choices = ['piedra', 'papel', 'tijeras'];
const rules = {
    piedra: 'tijeras', // La Roca aplasta las Hojas
    papel: 'piedra',   // El Pergamino envuelve la Roca
    tijeras: 'papel'   // Las Hojas cortan el Pergamino
};

// Mapeo de técnicas a sus símbolos arcanos
const emojiMap = {
    piedra: '🗿',
    papel: '📄',
    tijeras: '✂️'
};

// Recompensas y penalizaciones del duelo
const WIN_REWARD = 25; // Tesoro obtenido por la victoria
const LOSS_PENALTY = 10; // Honor perdido en la derrota

module.exports = {
    name: 'ppt',
    alias: ['piedrapapeltijeras', 'jankenpon'],
    description: 'Mide tus fuerzas en un duelo de Jankenpon y arrebata el tesoro del bot.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero registrado para participar en el duelo. Usa *${PREFIX}registrar*.` });
        }

        const userChoice = args[0]?.toLowerCase();
        if (!userChoice || !choices.includes(userChoice)) {
            const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica Desconocida ~*

Elige una técnica válida para el duelo.

┫ *Técnicas Disponibles:*
┃   \`${PREFIX}ppt piedra\`
┃   \`${PREFIX}ppt papel\`
┃   \`${PREFIX}ppt tijeras\`
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: usageMessage });
        }

        const botChoice = choices[Math.floor(Math.random() * choices.length)];
        let finalMessage;

        if (userChoice === botChoice) {
            finalMessage = 
`╪══════ 👹 ══════╪
    *~ ¡Duelo Empatado! ~*

👤 Tu Técnica: ${emojiMap[userChoice]}
vs
👹 Mi Técnica: ${emojiMap[botChoice]}

Ambos hemos usado la técnica *${userChoice}*.
El honor permanece intacto.
╪══════ •| ✧ |• ══════╪`;
        } else if (rules[userChoice] === botChoice) {
            DB.addCoins(userPhone, WIN_REWARD);
            finalMessage = 
`╪══════ 👹 ══════╪
    *~ ¡VICTORIA! ~*

👤 Tu Técnica: ${emojiMap[userChoice]}
vs
👹 Mi Técnica: ${emojiMap[botChoice]}

Tu *${userChoice}* ha superado mi *${botChoice}*.
¡Felicidades! Has ganado un tesoro de *${WIN_REWARD} monedas* 🪙.
╪══════ •| ✧ |• ══════╪`;
        } else {
            DB.removeCoins(userPhone, LOSS_PENALTY);
            finalMessage = 
`╪══════ 👹 ══════╪
    *~ ¡DERROTA! ~*

👤 Tu Técnica: ${emojiMap[userChoice]}
vs
👹 Mi Técnica: ${emojiMap[botChoice]}

Mi *${botChoice}* ha superado tu *${userChoice}*.
Has perdido *${LOSS_PENALTY} monedas* de tu tesoro 🪙.
╪══════ •| ✧ |• ══════╪`;
        }

        await sock.sendMessage(chatJid, { text: finalMessage });
    }
};