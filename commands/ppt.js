// commands/ppt.js (VERSIÓN COMMONJS - JUEGO PIEDRA, PAPEL O TIJERAS MEJORADO)

const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';

// Definimos las opciones y las reglas del juego
const choices = ['piedra', 'papel', 'tijeras'];
const rules = {
    piedra: 'tijeras', // Piedra le gana a tijeras
    papel: 'piedra',   // Papel le gana a piedra
    tijeras: 'papel'   // Tijeras le gana a papel
};

// Mapeo de jugadas a emojis para un mensaje más visual
const emojiMap = {
    piedra: '🗿',
    papel: '📄',
    tijeras: '✂️'
};

// Recompensas y penalizaciones
const WIN_REWARD = 25; // Monedas que se ganan por victoria
const LOSS_PENALTY = 10; // Monedas que se pierden por derrota

module.exports = {
    name: 'ppt',
    alias: ['piedrapapeltijeras'],
    description: 'Juega Piedra, Papel o Tijeras contra el bot.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        // 1. Verificación de registro
        const userPhone = userJid.split('@')[0];
        const user = DB.getUserByPhone(userPhone);
        if (!user) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para jugar, primero debes registrarte con *${PREFIX}registrar*.` });
        }

        // 2. Verificación de la jugada del usuario
        const userChoice = args[0]?.toLowerCase();
        if (!userChoice || !choices.includes(userChoice)) {
            return sock.sendMessage(chatJid, { text: `🤔 Jugada no válida. Inténtalo de nuevo.\n\n*Uso:* ${PREFIX}ppt <piedra|papel|tijeras>` });
        }

        // 3. El bot elige su jugada al azar
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        // 4. Determinar el resultado y construir el mensaje final
        let finalMessage;

        if (userChoice === botChoice) {
            // Empate
            finalMessage = 
`🌟 ━━━━━ ✦ ━━━━━ 🌟
          *¡EMPATE!* 😐
 
     👤 Tú: ${emojiMap[userChoice]} vs 🤖 Bot: ${emojiMap[botChoice]}
 
 Ambos elegimos *${userChoice}*.
 ¡La próxima te gano!
🌟 ━━━━━ ✦ ━━━━━ 🌟`;
        } else if (rules[userChoice] === botChoice) {
            // El usuario gana
            DB.addCoins(userPhone, WIN_REWARD); // Se añaden las monedas al usuario
            finalMessage = 
`💎 ━━━━━ ✦ ━━━━━ 💎
        *¡GANASTE!* 🎉🥳
 
     👤 Tú: ${emojiMap[userChoice]} vs 🤖 Bot: ${emojiMap[botChoice]}
 
 Tu *${userChoice}* le gana a mi *${botChoice}*.
 ¡Felicidades! Has ganado *${WIN_REWARD} monedas* 🪙.
💎 ━━━━━ ✦ ━━━━━ 💎`;
        } else {
            // El bot gana (el usuario pierde)
            DB.removeCoins(userPhone, LOSS_PENALTY); // Se restan las monedas al usuario
            finalMessage = 
`🤖 ━━━━━ ✦ ━━━━━ 🤖
       *¡PERDISTE!* 😢
 
     👤 Tú: ${emojiMap[userChoice]} vs 🤖 Bot: ${emojiMap[botChoice]}
 
 Mi *${botChoice}* le gana a tu *${userChoice}*.
 Has perdido *${LOSS_PENALTY} monedas* 🪙.
🤖 ━━━━━ ✦ ━━━━━ 🤖`;
        }

        // 5. Enviar el resultado al chat
        await sock.sendMessage(chatJid, { text: finalMessage });
    }
};