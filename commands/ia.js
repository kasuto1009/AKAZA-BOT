// commands/ia.js (VERSIÓN "KATANA DEMONIACA")

const { askGemini } = require('../libs/gemini.js');
const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'ia',
    alias: ['gemini', 'ai', 'gpt', 'google', 'buscar', 'search', 'g'],
    description: 'Consulta al Oráculo de Sangre para obtener conocimiento prohibido.',
    public: false, // Requiere registro

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);

            if (!user) {
                return sock.sendMessage(chatJid, { text: `👹 Debes ser un guerrero del clan para consultar al Oráculo de Sangre. Usa \`${PREFIX}registrar\`.` });
            }

            const isAdmin = user.is_admin || userJid === OWNER_NUMBER;
            const credits = user.ia_credits || 0;

            if (!isAdmin && credits < 1) {
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

            const response = await askGemini(query);

            if (response.startsWith('❌') || response.toLowerCase().startsWith('lo siento')) {
                return sock.sendMessage(chatJid, { text: response });
            }

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
            }

        } catch (error) {
            console.error('[IA COMMAND ERROR]', error);
            sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al consultar al Oráculo de Sangre.' });
        }
    }
};