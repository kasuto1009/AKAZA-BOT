// commands/misgrupos.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'misgrupos',
    alias: ['grupos', 'grouplist'],
    description: 'Consulta y controla el pergamino de los clanes bajo tu dominio.',
    public: true, // Visible para todos, pero restringido al owner
    
    execute: async (sock, msg, args, ctx) => {
        const { userJid, chatJid } = ctx;

        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '👹 Solo el Maestro del Bot puede consultar el Pergamino de Clanes.' });
        }

        const allGroups = DB.getAllGroups();
        if (!allGroups || allGroups.length === 0) {
            return sock.sendMessage(chatJid, { text: '✅ El bot aún no ha sido invocado a ningún clan. Un Hashira debe usar `!registrar-grupo` en cada uno.' });
        }

        let groupListMessage = 
`╪══════ 👹 ══════╪
    *~ Pergamino de Clanes ~*

Responde para alterar el Sello de Actividad:
┫ \`activar <numero>\`
┫ \`desactivar <numero>\`
┫ \`cancelar\`
╪══════ •| ✧ |• ══════╪\n\n`;

        allGroups.forEach((group, index) => {
            const status = group.is_active ? '✅ Activo' : '❌ Inactivo';
            groupListMessage += `${index + 1}) *Clan:* ${group.name}\n   › *Sello de Actividad:* ${status}\n\n`;
        });

        State.start(chatJid, userJid, 'misgrupos', { groupList: allGroups });
        await sock.sendMessage(chatJid, { text: groupListMessage.trim() });
    },

    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid } = ctx;
        const st = State.get(chatJid, userJid);

        if (!st || st.flow !== 'misgrupos') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim().toLowerCase();
        const parts = text.split(' ');
        const action = parts[0];
        const selection = parseInt(parts[1], 10);

        if (action === 'cancelar') {
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '✖️ El pergamino ha sido cerrado.' });
        }

        if (['activar', 'desactivar'].includes(action) && !isNaN(selection)) {
            const groupToModify = st.data.groupList[selection - 1];
            if (!groupToModify) {
                return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no corresponde a ningún clan en el pergamino.` });
            }
            
            const newStatus = action === 'activar';
            DB.toggleGroupStatus(groupToModify.group_id, newStatus);
            
            const statusText = newStatus ? 'activado' : 'desactivado';
            const confirmationMessage = 
`╪══════ 👹 ══════╪
    *~ Sello Modificado ~*

✅ ¡Éxito! El Sello de Actividad para el clan *${groupToModify.name}* ha sido *${statusText}*.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: confirmationMessage });
            
            State.clear(chatJid, userJid);
        } else {
            await sock.sendMessage(chatJid, { text: '❌ Técnica no reconocida. Responde con `activar <numero>`, `desactivar <numero>` o `cancelar`.' });
        }
    }
};