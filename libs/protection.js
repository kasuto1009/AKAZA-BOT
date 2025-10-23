<<<<<<< HEAD
// libs/protection.js (VERSIÓN FINAL CON MENSAJES "ULTRA PREMIUM")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

// Patrones de enlaces y palabras ofensivas (sin cambios)
const LINK_PATTERNS = { whatsapp: /chat\.whatsapp\.com/i, general: /https?:\/\//i };
=======
// libs/protection.js (VERSIÓN COMMONJS - MEJORADA Y COMPATIBLE)

const DB = require('../core/db.js');

// Patrones de enlaces (expresiones regulares)
const LINK_PATTERNS = {
    whatsapp: /chat\.whatsapp\.com/i,
    general: /https?:\/\//i
};

// Listas de palabras y prefijos para las protecciones
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
const TOXIC_WORDS = new Set(['puto', 'puta', 'idiota', 'imbecil', 'estupido', 'mierda', 'coño', 'cabron', 'hijueputa', 'malparido', 'pendejo', 'maricon', 'perra', 'zorra']);

/**
 * Revisa un mensaje para ver si viola alguna protección activa.
<<<<<<< HEAD
 * @param {object} sock - La instancia del socket de Baileys.
 * @param {object} msg - El objeto de mensaje original de Baileys.
 * @param {Map} groupAdminsCache - La caché con las listas de administradores.
 * @returns {Promise<object>} Un objeto que indica si hubo una violación y de qué tipo.
 */
async function checkProtections(sock, msg, groupAdminsCache) {
    const chatJid = msg.key.remoteJid;
    const userJid = jidNormalizedUser(msg.key.participant || msg.key.remoteJid);
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    if (!chatJid.endsWith('@g.us') || !text) {
        return { violation: false };
    }

    const settings = DB.getChatSettings(chatJid);
    if (!settings) return { violation: false };

<<<<<<< HEAD
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
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
}

/**
 * Ejecuta la sanción correspondiente a una violación.
 * @param {object} sock - La instancia del socket.
 * @param {object} msg - El objeto de mensaje original.
 * @param {string} type - El tipo de violación ('antilink', 'antitoxic', etc.).
<<<<<<< HEAD
 * @param {string} userJid - El JID real del usuario (resuelto en index.js).
 */
async function executeAction(sock, msg, type, userJid) {
    const groupId = msg.key.remoteJid;
    const messageKey = msg.key;
    const userPhone = userJid.split('@')[0];
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
=======
 */
async function executeAction(sock, msg, type) {
    const groupId = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;
    const messageKey = msg.key;
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

    const reasons = {
        'antilink': 'Envío de enlaces de WhatsApp 🔗',
        'antilink2': 'Envío de enlaces externos 🔗',
        'antitoxic': 'Uso de lenguaje ofensivo 💬'
    };
    const reason = reasons[type] || 'Violación de las reglas del grupo';

<<<<<<< HEAD
    try {
        const metadata = await sock.groupMetadata(groupId);
        const botJid = jidNormalizedUser(sock.user.id);
        const botParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === botJid || jidNormalizedUser(p.jid) === botJid);
=======
    console.log(`[PROTECTION] Sanción aplicada a ${userJid} en ${groupId} por: ${reason}`);

    try {
        // Verificamos si el bot es admin antes de actuar
        const metadata = await sock.groupMetadata(groupId);
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const botParticipant = metadata.participants.find(p => p.id === botJid);
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        if (!botParticipant?.admin) {
            return sock.sendMessage(groupId, { text: `⚠️ ¡Alerta de protección! No puedo aplicar sanciones porque no soy administrador.` });
        }

<<<<<<< HEAD
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
=======
        // Eliminar el mensaje infractor
        await sock.sendMessage(groupId, { delete: messageKey });

        // Enviar advertencia y expulsar
        const warningMessage = `🚨 *¡Protección Activada!* 🚨\n\n*Usuario:* @${userJid.split('@')[0]}\n*Razón:* ${reason}\n*Acción:* Expulsión`;
        await sock.sendMessage(groupId, { text: warningMessage, mentions: [userJid] });
        
        await sock.groupParticipantsUpdate(groupId, [userJid], 'remove');
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    } catch (error) {
        console.error("Error al aplicar la sanción:", error);
    }
}

<<<<<<< HEAD
=======
// Exportamos las funciones para que index.js pueda usarlas
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
module.exports = {
    checkProtections,
    executeAction
};