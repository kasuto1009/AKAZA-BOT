// commands/advertir.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

// --- Función Helper para identificar al usuario objetivo ---
function getTargetJid(msg, args) {
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    }
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        return msg.message.extendedTextMessage.contextInfo.participant;
    }
    const targetArg = args.find(arg => arg.startsWith('@') || /^\d+$/.test(arg.replace('@', '')));
    const target = targetArg?.replace('@', '').replace(/\D/g, '');
    if (target) {
        return `${target}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name: 'advertir',
    alias: ['warn', 'advertencia'],
    description: 'Desata una técnica de advertencia sobre un miembro del grupo.',
    adminOnly: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo puede ser ejecutada en el campo de batalla (grupos).' });
        }

        const subCommand = args[0]?.toLowerCase();
        const targetJid = getTargetJid(msg, args);

        // --- SUB-COMANDO: !advertir max <cantidad> ---
        if (subCommand === 'max') {
            const max = parseInt(args[1], 10);
            if (isNaN(max) || max < 1 || max > 10) {
                return sock.sendMessage(chatJid, { text: '⚠️ Debes proporcionar un número de deshonras entre 1 y 10.' });
            }
            DB.setMaxWarnings(chatJid, max);
            const maxMessage = 
`╪══════ 👹 ══════╪
    *~ Postura Defensiva: Límite ~*

✅ El número máximo de deshonras (advertencias) para este grupo ha sido establecido en *${max}*.

Un guerrero será desterrado automáticamente al alcanzar este límite.
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: maxMessage });
        }

        // --- SUB-COMANDO: !advertir lista ---
        if (subCommand === 'lista') {
            const warnedUsers = DB.getWarnedUsers(chatJid);
            if (!warnedUsers || warnedUsers.length === 0) {
                return sock.sendMessage(chatJid, { text: '✅ El campo de batalla está limpio. No hay deshonras registradas.' });
            }
            let listMessage = 
`╪══════ 👹 ══════╪
    *~ Registro de Deshonras ~*\n\n`;
            for (const user of warnedUsers) {
                const userData = DB.getUserByPhone(user.user_phone);
                listMessage += `┫ ${userData?.alias || user.user_phone}: ${user.warn_count} deshonra(s)\n`;
            }
            listMessage += '╪══════ •| ✧ |• ══════╪';
            return sock.sendMessage(chatJid, { text: listMessage });
        }

        // --- SUB-COMANDOS QUE REQUIEREN UN OBJETIVO (@usuario) ---
        if (!targetJid) {
            const helpMessage = 
`╪══════ 👹 ══════╪
   *~ Técnica de Sangre: Advertencia ~*

┫ \`${PREFIX}advertir @objetivo <razón>\`
┃   Marca al objetivo con una deshonra.

┫ \`${PREFIX}advertir @objetivo\`
┃   Muestra el pergamino de deshonras del objetivo.

┫ \`${PREFIX}advertir @objetivo borrar\`
┃   Inicia la técnica para perdonar una deshonra.

┫ \`${PREFIX}advertir lista\`
┃   Muestra el registro de todas las deshonras.

┫ \`${PREFIX}advertir max <número>\`
┃   Establece el límite de deshonras (1-10).
╪══════ •| ✧ |• ══════╪`;
            return sock.sendMessage(chatJid, { text: helpMessage });
        }
        
        const targetPhone = jidNormalizedUser(targetJid).split('@')[0];
        const reason = args.filter(arg => !arg.startsWith('@') && isNaN(arg) && arg.toLowerCase() !== 'borrar' && arg.toLowerCase() !== 'todo').join(' ');

        // --- SUB-COMANDO: !advertir @usuario borrar ---
        if (args.some(arg => arg.toLowerCase() === 'borrar')) {
            const userWarnings = DB.getWarningsForUser(chatJid, targetPhone);
            if (userWarnings.length === 0) {
                return sock.sendMessage(chatJid, { text: `✅ El objetivo @${targetPhone} no tiene deshonras.`, mentions: [targetJid] });
            }

            if (args.includes('todo')) {
                DB.clearWarnings(chatJid, targetPhone);
                return sock.sendMessage(chatJid, { text: `✅ Todas las deshonras de @${targetPhone} han sido perdonadas.`, mentions: [targetJid] });
            }
            
            let warnListMsg = 
`╪══════ 👹 ══════╪
    *~ Técnica de Perdón ~*

Elige la deshonra que será perdonada para @${targetPhone}.

Responde con el número correspondiente:\n\n`;
            userWarnings.forEach((warn, i) => {
                warnListMsg += `${i + 1}) *Razón:* ${warn.reason}\n   *Fecha:* ${new Date(warn.timestamp).toLocaleDateString('es-EC')}\n\n`;
            });
            warnListMsg += `0) Cancelar
╪══════ •| ✧ |• ══════╪`;
            
            State.start(chatJid, userJid, 'borrar-advertencia', { warnings: userWarnings, targetJid });
            return sock.sendMessage(chatJid, { text: warnListMsg, mentions: [targetJid] });
        }

        // --- SUB-COMANDO: !advertir @usuario (Ver Historial) ---
        if (!reason) {
            const userWarnings = DB.getWarningsForUser(chatJid, targetPhone);
            if (userWarnings.length === 0) {
                return sock.sendMessage(chatJid, { text: `✅ El objetivo @${targetPhone} no tiene deshonras.`, mentions: [targetJid] });
            }
            let historyMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino de Deshonras: @${targetPhone} ~*\n\n`;
            let mentions = [targetJid];
            userWarnings.forEach(warn => {
                const adminData = DB.getUserByPhone(warn.given_by);
                const adminIdentifier = adminData ? `@${warn.given_by}` : (warn.given_by.includes('Automático') ? '🤖 Sistema Automático' : warn.given_by);
                if (adminData) mentions.push(`${warn.given_by}@s.whatsapp.net`);
                historyMessage += `┫ *Razón:* ${warn.reason}\n┃ *Ejecutado por:* ${adminIdentifier}\n┃ *Fecha:* ${new Date(warn.timestamp).toLocaleString('es-EC')}\n\n`;
            });
            historyMessage += '╪══════ •| ✧ |• ══════╪';
            return sock.sendMessage(chatJid, { text: historyMessage, mentions: mentions });
        }

        // --- COMANDO PRINCIPAL: !advertir @usuario <razón> ---
        try {
            const metadata = await sock.groupMetadata(chatJid);
            const targetParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(targetJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(targetJid));

            if (targetJid === OWNER_NUMBER || targetParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '👹 Un Hashira o una Luna Superior no pueden ser deshonrados.' });
            }

            DB.addWarning(chatJid, targetPhone, reason, userJid);
            const userWarnings = DB.getWarningsForUser(chatJid, targetPhone);
            const warningCount = userWarnings.length;

            const groupSettings = DB.getChatSettings(chatJid);
            const maxWarnings = groupSettings.max_warnings || 3;

            if (warningCount >= maxWarnings) {
                DB.logWarnKick(chatJid, targetPhone, `Alcanzó el límite de ${maxWarnings} advertencias.`);
                DB.clearWarnings(chatJid, targetPhone);

                const kickMessage = 
`╪══════ 👹 ══════╪
    *~ Técnica Final: Destierro ~*

El objetivo @${targetPhone} ha sido desterrado por acumular *${maxWarnings} deshonras*.
╪══════ •| ✧ |• ══════╪`;
                await sock.sendMessage(chatJid, { text: kickMessage, mentions: [targetJid] });
                await sock.groupParticipantsUpdate(chatJid, [targetJid], 'remove');
                
                await sock.sendMessage(OWNER_NUMBER, { text: `🔔 *Notificación de Destierro*\n\n*Objetivo:* ${targetPhone}\n*Grupo:* ${metadata.subject}\n*Razón:* Alcanzó el límite de ${maxWarnings} deshonras.` });

            } else {
                const warningMessage = 
`╪══════ 👹 ══════╪
    *~ Marca de Deshonra ~*

*Objetivo:* @${targetPhone}
*Razón:* ${reason}

Ahora posee *${warningCount}/${maxWarnings}* marca(s) de deshonra.
╪══════ •| ✧ |• ══════╪`;
                await sock.sendMessage(chatJid, { text: warningMessage, mentions: [targetJid] });
            }

        } catch (error) {
            console.error('[ADVERTIR COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al ejecutar la técnica.' });
        }
    },

    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid } = ctx;
        const st = State.get(chatJid, userJid);
        if (!st || st.flow !== 'borrar-advertencia') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const selection = parseInt(text, 10);

        if (isNaN(selection) || selection < 0) {
            return await sock.sendMessage(chatJid, { text: '❌ Respuesta no válida. Responde con un número.' });
        }
        if (selection === 0) {
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '✖️ La técnica ha sido cancelada.' });
        }

        const warnToDelete = st.data.warnings[selection - 1];
        if (!warnToDelete) {
            return sock.sendMessage(chatJid, { text: `❌ El número ${selection} no es una opción válida.` });
        }

        DB.removeWarning(warnToDelete.warning_id);
        const targetPhone = st.data.targetJid.split('@')[0];
        
        const confirmationMessage = 
`╪══════ 👹 ══════╪
    *~ Perdón Concedido ~*

✅ La deshonra para @${targetPhone} ha sido eliminada del registro.
╪══════ •| ✧ |• ══════╪`;

        await sock.sendMessage(chatJid, { text: confirmationMessage, mentions: [st.data.targetJid] });
        State.clear(chatJid, userJid);
    }
};
