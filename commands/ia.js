// commands/ia.js (VERSIÓN FINAL CON SISTEMA DE CRÉDITOS)

const { askGemini } = require('../libs/gemini.js');
const DB = require('../core/db.js');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'ia',
    alias: ['gemini', 'ai', 'gpt', 'google', 'buscar', 'search', 'g'],
    description: 'Conversa o busca información usando la IA de Google Gemini.',
    public: false, // Requiere registro para poder usar créditos

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        try {
            const userPhone = userJid.split('@')[0];
            const user = DB.getUserByPhone(userPhone);

            if (!user) {
                return sock.sendMessage(chatJid, { text: `⚠️ Para usar la IA, primero debes registrarte. Usa el comando: \`${PREFIX}registrar\`` });
            }

            // --- VERIFICACIÓN DE CRÉDITOS DE IA (SOLO PARA USUARIOS NORMALES) ---
            const isAdmin = user.is_admin || userJid === OWNER_NUMBER;
            const credits = user.ia_credits || 0;

            if (!isAdmin && credits < 1) {
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

            const response = await askGemini(query);

            if (response.startsWith('❌') || response.toLowerCase().startsWith('lo siento')) {
                return sock.sendMessage(chatJid, { text: response });
            }

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
            }

        } catch (error) {
            console.error('[IA COMMAND ERROR]', error);
            sock.sendMessage(chatJid, { text: '❌ Ocurrió un error inesperado al procesar tu solicitud de IA.' });
        }
    }
};