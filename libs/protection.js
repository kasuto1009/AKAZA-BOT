// libs/protection.js (VERSIÓN COMMONJS - MEJORADA Y COMPATIBLE)

const DB = require('../core/db.js');

// Patrones de enlaces (expresiones regulares)
const LINK_PATTERNS = {
    whatsapp: /chat\.whatsapp\.com/i,
    general: /https?:\/\//i
};

// Listas de palabras y prefijos para las protecciones
const TOXIC_WORDS = new Set(['puto', 'puta', 'idiota', 'imbecil', 'estupido', 'mierda', 'coño', 'cabron', 'hijueputa', 'malparido', 'pendejo', 'maricon', 'perra', 'zorra']);

/**
 * Revisa un mensaje para ver si viola alguna protección activa.
 * NO ejecuta la acción, solo detecta.
 * @param {object} sock - La instancia del socket de Baileys.
 * @param {object} msg - El objeto de mensaje original de Baileys.
 * @returns {Promise<object>} Un objeto que indica si hubo una violación y de qué tipo.
 */
async function checkProtections(sock, msg) {
    const chatJid = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    // Las protecciones solo aplican a mensajes de texto en grupos.
    if (!chatJid.endsWith('@g.us') || !text) {
        return { violation: false };
    }

    const settings = DB.getChatSettings(chatJid);
    if (!settings) return { violation: false };

    try {
        // No aplicar protecciones a los administradores del grupo
        const metadata = await sock.groupMetadata(chatJid);
        const userParticipant = metadata.participants.find(p => p.id === userJid);
        if (userParticipant?.admin) {
            return { violation: false };
        }

        // 1. Verificación de Enlaces
        if (settings.antilink && LINK_PATTERNS.whatsapp.test(text)) {
            return { violation: true, type: 'antilink' };
        }
        if (settings.antilink2 && LINK_PATTERNS.general.test(text)) {
            return { violation: true, type: 'antilink2' };
        }
        
        // 2. Verificación de Lenguaje Ofensivo
        if (settings.antitoxic) {
            const words = text.toLowerCase().split(/\s+/);
            if (words.some(word => TOXIC_WORDS.has(word))) {
                return { violation: true, type: 'antitoxic' };
            }
        }

    } catch (error) {
        console.error("[PROTECTION CHECK ERROR]", error);
    }

    return { violation: false }; // No se encontraron violaciones
}

/**
 * Ejecuta la sanción correspondiente a una violación.
 * @param {object} sock - La instancia del socket.
 * @param {object} msg - El objeto de mensaje original.
 * @param {string} type - El tipo de violación ('antilink', 'antitoxic', etc.).
 */
async function executeAction(sock, msg, type) {
    const groupId = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;
    const messageKey = msg.key;

    const reasons = {
        'antilink': 'Envío de enlaces de WhatsApp 🔗',
        'antilink2': 'Envío de enlaces externos 🔗',
        'antitoxic': 'Uso de lenguaje ofensivo 💬'
    };
    const reason = reasons[type] || 'Violación de las reglas del grupo';

    console.log(`[PROTECTION] Sanción aplicada a ${userJid} en ${groupId} por: ${reason}`);

    try {
        // Verificamos si el bot es admin antes de actuar
        const metadata = await sock.groupMetadata(groupId);
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = metadata.participants.find(p => p.id === botJid);
        if (!botParticipant?.admin) {
            return sock.sendMessage(groupId, { text: `⚠️ ¡Alerta de protección! No puedo aplicar sanciones porque no soy administrador.` });
        }

        // Eliminar el mensaje infractor
        await sock.sendMessage(groupId, { delete: messageKey });

        // Enviar advertencia y expulsar
        const warningMessage = `🚨 *¡Protección Activada!* 🚨\n\n*Usuario:* @${userJid.split('@')[0]}\n*Razón:* ${reason}\n*Acción:* Expulsión`;
        await sock.sendMessage(groupId, { text: warningMessage, mentions: [userJid] });
        
        await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
    } catch (error) {
        console.error("Error al aplicar la sanción:", error);
    }
}

// Exportamos las funciones para que index.js pueda usarlas
module.exports = {
    checkProtections,
    executeAction
};