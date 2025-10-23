<<<<<<< HEAD
// commands/borrar.js (VERSIÓN FINAL Y ROBUSTA)

const DB = require('../core/db.js');
const State = require('../core/state.js');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'borrar',
    alias: ['delete', 'elim'],
    description: 'Desata la técnica definitiva para borrar a un guerrero del pergamino de registros.',
    public: true,
    adminOnly: true,

    // --- PRIMER PASO: Mostrar el pergamino de guerreros ---
    execute: async (sock, msg, args, ctx) => { 
        const { chatJid, userJid } = ctx;

        const OWNER_NUMBER_CLEAN = OWNER_NUMBER.replace(/[^0-9]/g, '');
        const rawPhone = userJid.split('@')[0].replace(/[^0-9]/g, '');
        
        const isOwner = rawPhone === OWNER_NUMBER_CLEAN;
        const isAdminUser = DB.isAdmin(rawPhone);
        
        if (!isOwner && !isAdminUser) {
            return await sock.sendMessage(chatJid, { text: '👹 Solo un Hashira o una Luna Superior pueden ejecutar esta técnica.' });
        }

        // Usamos getUserByExactPhone en el futuro para obtener solo usuarios registrados (siempre números limpios)
        const allUsers = DB.getAllUsersSortedByDate(); 
        if (!allUsers || allUsers.length === 0) {
            State.clear(chatJid, userJid); // Limpia el estado por si acaso
            return await sock.sendMessage(chatJid, { text: '✅ El pergamino de guerreros está vacío. No hay registros que aniquilar.' });
        }

        let userListMessage = 
`╪══════ 👹 ══════╪
    *~ Técnica de Sangre: Aniquilación ~*

Elige al guerrero cuyo registro será borrado del pergamino.

Responde con el *número correspondiente*:\n\n`;
        allUsers.forEach((user, index) => {
            const registrationDate = new Date(user.created_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
            userListMessage += `${index + 1}) *Alias:* ${user.alias}\n   › *Número:* ${user.user_phone}\n   › *Registrado:* ${registrationDate}\n\n`;
        });
        userListMessage += `0) Cancelar
╪══════ •| ✧ |• ══════╪`;

        State.start(chatJid, userJid, 'borrar', { userList: allUsers });
        await sock.sendMessage(chatJid, { text: userListMessage });
    },

    // --- SEGUNDO PASO: Manejar la selección del objetivo ---
    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid } = ctx;
        const st = State.get(chatJid, userJid);

        // Si el estado se pierde (por el DB FATAL), limpiamos y salimos.
        if (!st || st.flow !== 'borrar') {
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '❌ Sesión expirada. Intenta usar !borrar de nuevo.' });
        }

        // Obtener el texto limpio y verificar si es un número válido
        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const selection = parseInt(text, 10);

        // Si la selección no es numérica o es negativa
        if (isNaN(selection) || selection < 0 || selection > st.data.userList.length) { 
            // Limpiamos el estado aquí para que no siga procesando entradas basura
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '❌ Respuesta no válida. Debes responder con un número válido del pergamino (0 a ' + st.data.userList.length + ').' });
        }

        if (selection === 0) {
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '✖️ Técnica de aniquilación cancelada.' });
        }

        const userToDelete = st.data.userList[selection - 1];
        if (!userToDelete) {
            State.clear(chatJid, userJid); 
            return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no corresponde a ningún guerrero en el pergamino.` });
        }

        // Ejecutar la eliminación
        const result = DB.deleteUserByPhone(userToDelete.user_phone);

        if (result && result.changes > 0) {
            const successMessage = 
`╪══════ 👹 ══════╪
    *~ Aniquilación Completada ~*

✅ ¡Éxito! El registro del guerrero *${userToDelete.alias}* (${userToDelete.user_phone}) ha sido borrado del pergamino.
╪══════ •| ✧ |• ══════╪`;
            await sock.sendMessage(chatJid, { text: successMessage });
        } else {
            await sock.sendMessage(chatJid, { text: `❌ No se pudo aniquilar el registro de *${userToDelete.alias}*. Puede que ya haya sido borrado por otra técnica.` });
        }
        
        State.clear(chatJid, userJid);
    }
=======
// commands/borrar.js (VERSIÓN COMMONJS - INTERACTIVA Y MEJORADA)

const DB = require('../core/db.js');
const State = require('../core/state.js');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

module.exports = {
    name: 'borrar',
    alias: ['delete', 'elim'],
    description: 'Elimina el registro de un usuario de forma interactiva (admin/owner only).',
    public: true,
    adminOnly: true,

    // --- PRIMER PASO: Mostrar la lista de usuarios ---
    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        const isAllowed = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
        if (!isAllowed) {
            return await sock.sendMessage(chatJid, { text: '🚫 Solo los administradores registrados o el owner pueden usar este comando.' });
        }

        // Usamos la nueva función de la base de datos para obtener la lista ordenada
        const allUsers = DB.getAllUsersSortedByDate();
        if (!allUsers || allUsers.length === 0) {
            return await sock.sendMessage(chatJid, { text: 'ℹ️ No hay usuarios registrados en la base de datos.' });
        }

        let userListMessage = '🗑️ *Selecciona el usuario a eliminar*\n\nResponde con el número correspondiente al usuario que deseas borrar:\n\n';
        allUsers.forEach((user, index) => {
            const registrationDate = new Date(user.created_at).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
            userListMessage += `${index + 1}) *Alias:* ${user.alias}\n   *Número:* ${user.user_phone}\n   *Registrado:* ${registrationDate}\n\n`;
        });
        userListMessage += '0) Cancelar';

        // Guardamos la lista de usuarios en el estado para el siguiente paso
        State.start(chatJid, userJid, 'borrar', { userList: allUsers });

        await sock.sendMessage(chatJid, { text: userListMessage });
    },

    // --- SEGUNDO PASO: Manejar la selección numérica ---
    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid } = ctx;
        const st = State.get(chatJid, userJid);

        if (!st || st.flow !== 'borrar') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const selection = parseInt(text, 10);

        if (isNaN(selection)) {
            return await sock.sendMessage(chatJid, { text: '❌ Respuesta no válida. Por favor, responde con un número de la lista.' });
        }

        if (selection === 0) {
            State.clear(chatJid, userJid);
            return await sock.sendMessage(chatJid, { text: '✖️ Operación de borrado cancelada.' });
        }

        const userToDelete = st.data.userList[selection - 1];
        if (!userToDelete) {
            return await sock.sendMessage(chatJid, { text: `❌ El número ${selection} no es una opción válida en la lista.` });
        }

        // Realizamos el borrado usando la función que ya normaliza el teléfono
        const result = DB.deleteUserByPhone(userToDelete.user_phone);

        if (result && result.changes > 0) {
            await sock.sendMessage(chatJid, { text: `✅ ¡Éxito! El registro del usuario *${userToDelete.alias}* (${userToDelete.user_phone}) ha sido eliminado.` });
        } else {
            // Este mensaje ahora aparecerá si hay un error real, ya que la búsqueda será correcta
            await sock.sendMessage(chatJid, { text: `❌ No se pudo eliminar el registro de *${userToDelete.alias}*. Puede que ya haya sido borrado por otro medio.` });
        }
        
        State.clear(chatJid, userJid); // Limpiamos el estado al finalizar
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};