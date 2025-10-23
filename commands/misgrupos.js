<<<<<<< HEAD
// commands/misgrupos.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/misgrupos.js (VERSIÓN COMMONJS - PANEL DE CONTROL INTERACTIVO)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'misgrupos',
    alias: ['grupos', 'grouplist'],
<<<<<<< HEAD
    description: 'Consulta y controla el pergamino de los clanes bajo tu dominio.',
    public: true, // Visible para todos, pero restringido al owner
=======
    description: 'Gestiona los grupos en los que está el bot (solo owner).',
    public: true,
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    
    execute: async (sock, msg, args, ctx) => {
        const { userJid, chatJid } = ctx;

<<<<<<< HEAD
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
=======
        // Se normaliza el JID para una comparación segura
        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '🔒 Este comando es solo para el dueño del bot.' });
        }

        // Obtenemos los grupos desde nuestra base de datos, no desde Baileys
        const allGroups = DB.getAllGroups();
        if (!allGroups || allGroups.length === 0) {
            return sock.sendMessage(chatJid, { text: 'ℹ️ El bot no está registrado en ningún grupo todavía. Un administrador debe usar `!registrar-grupo` en cada grupo.' });
        }

        let groupListMessage = '📋 *Panel de Control de Grupos*\n\n';
        allGroups.forEach((group, index) => {
            const status = group.is_active ? '✅ Activo' : '❌ Inactivo';
            groupListMessage += `${index + 1}) *${group.name}*\n   *Estado:* ${status}\n\n`;
        });
        groupListMessage += 'Responde con `activar <numero>` o `desactivar <numero>` para cambiar el estado.\nEjemplo: `desactivar 1`\n\nResponde `cancelar` para salir.';

        // Iniciamos el flujo interactivo
        State.start(chatJid, userJid, 'misgrupos', { groupList: allGroups });

        await sock.sendMessage(chatJid, { text: groupListMessage });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
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
<<<<<<< HEAD
            return await sock.sendMessage(chatJid, { text: '✖️ El pergamino ha sido cerrado.' });
=======
            return await sock.sendMessage(chatJid, { text: '✖️ Operación cancelada.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }

        if (['activar', 'desactivar'].includes(action) && !isNaN(selection)) {
            const groupToModify = st.data.groupList[selection - 1];
            if (!groupToModify) {
<<<<<<< HEAD
                return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no corresponde a ningún clan en el pergamino.` });
=======
                return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no es una opción válida.` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            }
            
            const newStatus = action === 'activar';
            DB.toggleGroupStatus(groupToModify.group_id, newStatus);
            
            const statusText = newStatus ? 'activado' : 'desactivado';
<<<<<<< HEAD
            const confirmationMessage = 
`╪══════ 👹 ══════╪
    *~ Sello Modificado ~*

✅ ¡Éxito! El Sello de Actividad para el clan *${groupToModify.name}* ha sido *${statusText}*.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: confirmationMessage });
            
            State.clear(chatJid, userJid);
        } else {
            await sock.sendMessage(chatJid, { text: '❌ Técnica no reconocida. Responde con `activar <numero>`, `desactivar <numero>` o `cancelar`.' });
=======
            await sock.sendMessage(chatJid, { text: `✅ ¡Éxito! El bot ha sido *${statusText}* para el grupo *${groupToModify.name}*.` });
            
            State.clear(chatJid, userJid); // Finalizamos el flujo
        } else {
            await sock.sendMessage(chatJid, { text: '❌ Comando no válido. Responde con `activar <numero>`, `desactivar <numero>` o `cancelar`.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }
    }
};