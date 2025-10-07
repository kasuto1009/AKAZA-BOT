// commands/misgrupos.js (VERSIÓN COMMONJS - PANEL DE CONTROL INTERACTIVO)

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'misgrupos',
    alias: ['grupos', 'grouplist'],
    description: 'Gestiona los grupos en los que está el bot (solo owner).',
    public: true,
    
    execute: async (sock, msg, args, ctx) => {
        const { userJid, chatJid } = ctx;

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
            return await sock.sendMessage(chatJid, { text: '✖️ Operación cancelada.' });
        }

        if (['activar', 'desactivar'].includes(action) && !isNaN(selection)) {
            const groupToModify = st.data.groupList[selection - 1];
            if (!groupToModify) {
                return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no es una opción válida.` });
            }
            
            const newStatus = action === 'activar';
            DB.toggleGroupStatus(groupToModify.group_id, newStatus);
            
            const statusText = newStatus ? 'activado' : 'desactivado';
            await sock.sendMessage(chatJid, { text: `✅ ¡Éxito! El bot ha sido *${statusText}* para el grupo *${groupToModify.name}*.` });
            
            State.clear(chatJid, userJid); // Finalizamos el flujo
        } else {
            await sock.sendMessage(chatJid, { text: '❌ Comando no válido. Responde con `activar <numero>`, `desactivar <numero>` o `cancelar`.' });
        }
    }
};