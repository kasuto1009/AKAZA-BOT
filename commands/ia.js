<<<<<<< HEAD
// commands/ia.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/ia.js (VERSIÓN FINAL CON SISTEMA DE CRÉDITOS)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const { askGemini } = require('../libs/gemini.js');
const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'ia',
    alias: ['gemini', 'ai', 'gpt', 'google', 'buscar', 'search', 'g'],
<<<<<<< HEAD
    description: 'Consulta al Oráculo de Sangre para obtener conocimiento prohibido.',
    public: false, // Requiere registro
=======
    description: 'Conversa o busca información usando la IA de Google Gemini.',
    public: false, // Requiere registro para poder usar créditos
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);

            if (!user) {
<<<<<<< HEAD
                return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero del clan para consultar al Oráculo de Sangre. Usa \`${PREFIX}registrar\`.` });
            }

=======
                return sock.sendMessage(chatJid, { text: `⚠️ Para usar la IA, primero debes registrarte. Usa el comando: \`${PREFIX}registrar\`` });
            }

            // --- VERIFICACIÓN DE CRÉDITOS DE IA (SOLO PARA USUARIOS NORMALES) ---
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            const isAdmin = user.is_admin || userJid === OWNER_NUMBER;
            const credits = user.ia_credits || 0;

            if (!isAdmin && credits < 1) {
<<<<<<< HEAD
                const noCreditsMessage =
`╪══════ 👹 ══════╪
    *~ Conocimiento Insuficiente ~*

No posees suficientes pergaminos de sangre (créditos) para consultar al oráculo.

Actualmente tienes *${credits} pergaminos*.

Puedes obtener más en la tienda del clan:
\`${PREFIX}tienda comprar ia1\`
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: noCreditsMessage });
            }

            if (args.length === 0) {
                const adminText = isAdmin ? 'Conocimiento ilimitado' : `${credits} pergaminos restantes`;
                const usageMessage =
`╪══════ 👹 ══════╪
    *~ Técnica: Oráculo de Sangre ~*

┫ *Tus pergaminos:* ${adminText}

┫ *Ejemplo de uso:*
┃   \`${PREFIX}ia ¿cuál es la técnica de sangre de Akaza?\`
┃   \`${PREFIX}google cuéntame una leyenda de demonios\`
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: usageMessage });
            }

            const query = args.join(' ');
            await sock.sendMessage(chatJid, { text: '👹 El Oráculo de Sangre está descifrando el destino... por favor, espera un momento.' });
=======
                return sock.sendMessage(chatJid, { 
                    text: `🤖 *Créditos de IA insuficientes.*\n\nActualmente tienes *${credits}* créditos.\n\nPuedes comprar más en la tienda con el comando:\n\`${PREFIX}tienda comprar ia1\`` 
                });
            }

            if (args.length === 0) {
                const adminText = isAdmin ? 'Uso ilimitado' : `${credits} créditos restantes`;
                return sock.sendMessage(chatJid, { text: `🔮 *Comando IA (Google Gemini)*\n\n*Tus créditos:* ${adminText}\n\n*Ejemplo:*\n• ${PREFIX}ia ¿cuál es la capital de Ecuador?\n• ${PREFIX}google cuéntame un chiste` });
            }

            const query = args.join(' ');

            await sock.sendMessage(chatJid, { text: '🔮 Consultando con la IA de Gemini... por favor espera un momento.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

            const response = await askGemini(query);

            if (response.startsWith('❌') || response.toLowerCase().startsWith('lo siento')) {
                return sock.sendMessage(chatJid, { text: response });
            }

<<<<<<< HEAD
            const finalResponse = 
`╪══════ 👹 ══════╪
    *~ Veredicto del Oráculo ~*

${response}
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: finalResponse });

            if (!isAdmin) {
                DB.removeIaCredits(userPhone, 1);
                const newCredits = credits - 1;
                const creditMessage = 
`╪══════ 👹 ══════╪
    *~ Ofrenda Realizada ~*

┫ *Pergamino utilizado:* 1
┫ *Pergaminos restantes:* ${newCredits}
╪══════ •| ✧ |• ══════╪`;
                await sock.sendMessage(chatJid, { text: creditMessage });
            } else {
                await sock.sendMessage(chatJid, { text: `👑 *Conocimiento ilimitado como Hashira.*` });
=======
            const finalResponse = `🔮 *Respuesta de Gemini*\n\n${response}`;

            await sock.sendMessage(chatJid, { text: finalResponse });

            // --- REDUCCIÓN DE CRÉDITOS (SOLO PARA USUARIOS NORMALES) ---
            if (!isAdmin) {
                DB.removeIaCredits(userPhone, 1);
                const newCredits = credits - 1;
                await sock.sendMessage(chatJid, { text: `🤖 *Crédito utilizado:* 1\n🤖 *Créditos restantes:* ${newCredits}` });
            } else {
                // Mensaje opcional para administradores
                await sock.sendMessage(chatJid, { text: `👑 *Uso ilimitado como administrador.*` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            }

        } catch (error) {
            console.error('[IA COMMAND ERROR]', error);
<<<<<<< HEAD
            sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar al Oráculo de Sangre.' });
=======
            sock.sendMessage(chatJid, { text: '❌ Ocurrió un error inesperado al procesar tu solicitud de IA.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};