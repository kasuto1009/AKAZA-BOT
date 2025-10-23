// libs/protection.js (VERSIÓN FINAL CON MENSAJES "ULTRA PREMIUM")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

// Patrones de enlaces y palabras ofensivas (sin cambios)
const LINK_PATTERNS = { whatsapp: /chat\.whatsapp\.com/i, general: /https?:\/\//i };
const TOXIC_WORDS = new Set(['puto', 'puta', 'idiota', 'imbecil', 'estupido', 'mierda', 'coño', 'cabron', 'hijueputa', 'malparido', 'pendejo', 'maricon', 'perra', 'zorra']);

/**
 * Revisa un mensaje para ver si viola alguna protección activa.
 * @param {object} sock - La instancia del socket de Baileys.
 * @param {object} msg - El objeto de mensaje original de Baileys.
 * @param {Map} groupAdminsCache - La caché con las listas de administradores.
 * @returns {Promise<object>} Un objeto que indica si hubo una violación y de qué tipo.
 */
async function checkProtections(sock, msg, groupAdminsCache) {
    const chatJid = msg.key.remoteJid;
    const userJid = jidNormalizedUser(msg.key.participant || msg.key.remoteJid);
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    if (!chatJid.endsWith('@g.us') || !text) {
        return { violation: false };
    }

    const settings = DB.getChatSettings(chatJid);
    if (!settings) return { violation: false };

    // Se consulta la caché de admins para evitar peticiones a WhatsApp.
    const admins = groupAdminsCache.get(chatJid);
    if (admins && admins.has(userJid)) {
        return { violation: false };
    }

    // Lógica de detección de violaciones
    if (settings.antilink && LINK_PATTERNS.whatsapp.test(text)) {
        return { violation: true, type: 'antilink' };
    }
    if (settings.antilink2 && LINK_PATTERNS.general.test(text)) {
        return { violation: true, type: 'antilink2' };
    }
    if (settings.antitoxic) {
        const words = text.toLowerCase().split(/\s+/);
        if (words.some(word => TOXIC_WORDS.has(word))) {
            return { violation: true, type: 'antitoxic' };
        }
    }

    return { violation: false };
}

/**
 * Ejecuta la sanción correspondiente a una violación.
 * @param {object} sock - La instancia del socket.
 * @param {object} msg - El objeto de mensaje original.
 * @param {string} type - El tipo de violación ('antilink', 'antitoxic', etc.).
 * @param {string} userJid - El JID real del usuario (resuelto en index.js).
 */
async function executeAction(sock, msg, type, userJid) {
    const groupId = msg.key.remoteJid;
    const messageKey = msg.key;
    const userPhone = userJid.split('@')[0];
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

    const reasons = {
        'antilink': 'Envío de enlaces de WhatsApp 🔗',
        'antilink2': 'Envío de enlaces externos 🔗',
        'antitoxic': 'Uso de lenguaje ofensivo 💬'
    };
    const reason = reasons[type] || 'Violación de las reglas del grupo';

    try {
        const metadata = await sock.groupMetadata(groupId);
        const botJid = jidNormalizedUser(sock.user.id);
        const botParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);
        if (!botParticipant?.admin) {
            return sock.sendMessage(groupId, { text: `⚠️ ¡Alerta de protección! No puedo aplicar sanciones porque no soy administrador.` });
        }

        // --- ACCIÓN INMEDIATA: Eliminar el mensaje infractor ---
        await sock.sendMessage(groupId, { delete: messageKey });

        // Lógica de advertencia automática para 'antitoxic'
        if (type === 'antitoxic') {
            console.log(`[PROTECTION] Advirtiendo a ${userJid} por: ${reason}`);
            const exactReason = `Mensaje: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`;
            DB.addWarning(groupId, userPhone, exactReason, 'Akaza Bot (Automático)');
            
            const userWarnings = DB.getWarningsForUser(groupId, userPhone);
            const warningCount = userWarnings.length;
            const groupSettings = DB.getChatSettings(groupId);
            const maxWarnings = groupSettings.max_warnings || 3;

            if (warningCount >= maxWarnings) {
                DB.logWarnKick(groupId, userPhone, `Alcanzó el límite de ${maxWarnings} advertencias (automático).`);
                DB.clearWarnings(groupId, userPhone);

                const kickMessage = 
`🚨 ━━━━━ ✦ *Expulsión Automática* ✦ ━━━━━ 🚨

El usuario @${userPhone} ha sido expulsado por alcanzar el límite de *${maxWarnings} advertencias*.

*Última infracción:*
› ${reason}

🚨 ━━━━━ ✦ ━━━━━ 🚨`;
                await sock.sendMessage(groupId, { text: kickMessage, mentions: [userJid] });
                await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
                
                await sock.sendMessage(OWNER_NUMBER, { text: `🔔 *Notificación de Expulsión Automática*\n\n*Usuario:* ${userPhone}\n*Grupo:* ${metadata.subject}\n*Razón:* Alcanzó el límite de ${maxWarnings} advertencias (la última por lenguaje ofensivo).` });
            } else {
                const warningMessage = 
`⚠️ ━━━━━ ✦ *Advertencia Automática* ✦ ━━━━━ ⚠️

*Usuario:* @${userPhone}
*Razón:* ${reason}

Este usuario ahora tiene *${warningCount}/${maxWarnings}* advertencia(s).
Por favor, sigue las reglas del grupo.

⚠️ ━━━━━ ✦ ━━━━━ ⚠️`;
                await sock.sendMessage(groupId, { text: warningMessage, mentions: [userJid] });
            }
            
        } else {
            // Para otras violaciones (como anti-link), se mantiene la expulsión directa.
            console.log(`[PROTECTION] Expulsando a ${userJid} por: ${reason}`);
            const kickMessage = 
`🚨 ━━━━━ ✦ *Protección Activada* ✦ ━━━━━ 🚨

*Usuario:* @${userPhone}
*Razón:* ${reason}
*Acción:* Expulsión Inmediata

🚨 ━━━━━ ✦ ━━━━━ 🚨`;
            await sock.sendMessage(groupId, { text: kickMessage, mentions: [userJid] });
            await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
        }
    } catch (error) {
        console.error("Error al aplicar la sanción:", error);
    }
}

module.exports = {
    checkProtections,
    executeAction
};