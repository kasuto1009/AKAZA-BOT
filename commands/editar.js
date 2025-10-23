<<<<<<< HEAD
// commands/editar.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;
const PREFIX = process.env.PREFIX || '!';
=======
// commands/editar.js (VERSIÓN COMMONJS)

const DB = require('../core/db');
const State = require('../core/state');
const axios = require('axios');
const moment = require('moment-timezone');
const ct = require('countries-and-timezones');

const OWNER_NUMBER = process.env.OWNER_NUMBER; // Formato JID: 593...@s.whatsapp.net
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

// --- Funciones de validación ---
function isValidAge(x) { const n = Number(x); return Number.isInteger(n) && n >= 13 && n <= 120; }
function isValidAlias(x) { return /^[\w\-.]{2,20}$/.test(String(x || '')); }
function isValidEmail(x) { if (!x) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }

const FIELDS = [
<<<<<<< HEAD
    { key: 'name', label: 'Nombre', emoji: '👤' },
    { key: 'age', label: 'Edad', emoji: '🎂' },
    { key: 'country', label: 'País', emoji: '🌍' },
    { key: 'alias', label: 'Alias', emoji: '👹' },
    { key: 'email', label: 'Correo', emoji: '📧' }
];

// --- Funciones Helper con Diseño "Katana Demoníaca" ---
async function showMenu(sock, chatJid, target) {
    const userIdentifier = target.alias || target.user_phone;
    let menuText = 
`╪══════ 👹 ══════╪
    *~ Técnica de Sangre: Alteración ~*

Alterando el pergamino del guerrero *${userIdentifier}*.

┫ Responde con el número del dato a alterar:
`;

    FIELDS.forEach((field, index) => {
        menuText += `┃ ╰─ *${index + 1})* ${field.emoji} ${field.label}: ${target[field.key] || '—'}\n`;
    });

    menuText += `┃ ╰─ *0)* ❌ Cancelar
╪══════ •| ✧ |• ══════╪`;
    
    await sock.sendMessage(chatJid, { text: menuText });
=======
    { key: 'name', label: 'Nombre' },
    { key: 'age', label: 'Edad' },
    { key: 'country', label: 'País' },
    { key: 'alias', label: 'Alias' },
    { key: 'email', label: 'Correo' }
];

// --- Funciones Helper ---
function getUserTime(country) {
    try {
        const tzData = ct.getTimezonesForCountry(country);
        const tz = tzData ? tzData[0].name : 'UTC';
        return moment().tz(tz).format('YYYY-MM-DD HH:mm z');
    } catch { return 'Desconocida'; }
}

async function showMenu(sock, chatJid, target) {
    const userIdentifier = target.alias || target.user_phone;
    const lines = FIELDS.map((f, i) => `${i + 1}) ${f.label}: ${target[f.key] || '—'}`).join('\n');
    const userTime = target.country ? getUserTime(target.country) : 'Desconocida';
    const text = `✏️ ━━━━━ ✦ ━━━━━ ✏️
Editar perfil de *${userIdentifier}*
🕒 Hora local: ${userTime}

Responde con el número del campo a editar:

${lines}

0) Cancelar
━━━━━━━━━━━━━━`;
    await sock.sendMessage(chatJid, { text });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
}

async function showSummary(sock, chatJid, target, field, newValue) {
    const userIdentifier = target.alias || target.user_phone;
<<<<<<< HEAD
    const summary = 
`╪══════ 👹 ══════╪
    *~ Confirmación de Técnica ~*

Estás a punto de alterar el pergamino:

┫ 👤 *Guerrero:* ${userIdentifier}
┫ 📌 *Dato:* ${field.label}

┫ *Antiguo:* "${target[field.key] || '—'}"
┫ *Nuevo:* "${newValue}"

¿Ejecutas la técnica? Responde *Si* o *No*.
╪══════ •| ✧ |• ══════╪`;
=======
    const summary = `✨ ━━━━━ ✦ ━━━━━ ✨
📝 *Resumen de edición*
━━━━━━━━━━━━━━
👤 Usuario: ${userIdentifier}
🌍 País: ${target.country || '—'}
━━━━━━━━━━━━━━
📌 Campo: *${field}*
De: "${target[field] || '—'}"
A: "${newValue}"
━━━━━━━━━━━━━━
Confirma con *Si* o cancela con *No*
✨ ━━━━━ ✦ ━━━━━ ✨`;
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    await sock.sendMessage(chatJid, { text: summary });
}

async function showFinalProfile(sock, chatJid, target) {
<<<<<<< HEAD
    const profile = 
`╪══════ 👹 ══════╪
    *~ Pergamino Actualizado ~*

┫ 👹 *Alias:* ${target.alias || '—'}
┫ 👤 *Nombre:* ${target.name || '—'}
┫ 🎂 *Edad:* ${target.age || '—'}
┫ 🌍 *País:* ${target.country || '—'}
┫ 📧 *Correo:* ${target.email || '—'}
╪══════ •| ✧ |• ══════╪
┫ 🕒 *Registrado:* ${new Date(target.created_at).toLocaleString('es-EC')}
┫ 📌 *Última alteración:* ${new Date().toLocaleString('es-EC')}
╪══════ •| ✧ |• ══════╪`;
=======
    const profile = `📖 ━━━━━ ✦ ━━━━━ 📖
✅ *Perfil actualizado*
━━━━━━━━━━━━━━
🧾 ID: ${target.internal_id || '—'}
👤 Nombre: ${target.name || '—'}
🎭 Alias: ${target.alias || '—'}
🎂 Edad: ${target.age || '—'}
🌍 País: ${target.country || '—'}
📧 Correo: ${target.email || '—'}
🕒 Registrado: ${new Date(target.created_at).toLocaleString('es-EC')}
📌 Última edición: ${new Date().toLocaleString('es-EC')}
📖 ━━━━━ ✦ ━━━━━ 📖`;
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
    await sock.sendMessage(chatJid, { text: profile });
}

// --- Lógica Principal del Comando ---
module.exports = {
    name: 'editar',
    alias: ['edit'],
<<<<<<< HEAD
    description: 'Ejecuta una técnica para alterar el pergamino de un guerrero.',
    public: true,
=======
    description: 'Editar el perfil de un usuario (admin/owner puede editar a otros).',
    public: true,
    adminOnly: true, // Lógica de permisos reforzada internamente
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        let targetJid;
        if (args.length > 0) {
<<<<<<< HEAD
            const isAllowed = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
            if (!isAllowed) {
                return await sock.sendMessage(chatJid, { text: '👹 Solo un Hashira o una Luna Superior pueden alterar los pergaminos de otros guerreros.' });
            }
=======
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            const targetPhone = args[0].replace(/\D/g, '');
            targetJid = `${targetPhone}@s.whatsapp.net`;
        } else {
            targetJid = userJid;
        }

<<<<<<< HEAD
        const target = DB.getUserByPhone(targetJid.split('@')[0]);
        if (!target) return await sock.sendMessage(chatJid, { text: `❌ El guerrero con el número ${targetJid.split('@')[0]} no se encuentra en el pergamino.` });

        State.start(chatJid, userJid, 'editar', { target, step: 0 });
=======
        // Si se intenta editar a otro usuario, verificar permisos
        if (targetJid !== userJid) {
            const isAllowed = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
            if (!isAllowed) {
                return await sock.sendMessage(chatJid, { text: '🚫 Solo los administradores del bot pueden editar perfiles de otros usuarios.' });
            }
        }

        const target = DB.getUserByPhone(targetJid.split('@')[0]);
        if (!target) return await sock.sendMessage(chatJid, { text: `❌ El usuario con número ${targetJid.split('@')[0]} no está registrado.` });

        // Iniciar el flujo de conversación
        State.start(chatJid, userJid, 'editar', { target, step: 0 }); // Inicializamos el paso en 0
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        await showMenu(sock, chatJid, target);
    },

    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid } = ctx;
        const st = State.get(chatJid, userJid);
        if (!st || st.flow !== 'editar') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const textLower = text.toLowerCase();
        const target = st.data.target;

        if (text === '0' || textLower === 'cancelar') {
            State.clear(chatJid, userJid);
<<<<<<< HEAD
            return await sock.sendMessage(chatJid, { text: '✖️ Técnica de alteración cancelada.' });
        }

        if (st.data.step === 0) {
            const sel = Number(text);
            if (isNaN(sel) || sel < 1 || sel > FIELDS.length) {
                return await sock.sendMessage(chatJid, { text: '❌ Selección inválida. Responde con un número del pergamino.' });
=======
            return await sock.sendMessage(chatJid, { text: '✖️ Edición cancelada.' });
        }

        // Paso 0: Esperando la selección del campo
        if (st.data.step === 0) {
            const sel = Number(text);
            if (isNaN(sel) || sel < 1 || sel > FIELDS.length) {
                return await sock.sendMessage(chatJid, { text: 'Selección inválida. Responde con un número del menú.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            }

            st.data.chosenIndex = sel - 1;
            st.data.step = 1;
            State.set(chatJid, userJid, st);
            const fieldKey = FIELDS[st.data.chosenIndex].key;
            return await sock.sendMessage(chatJid, { text: `✏️ Ingresa el nuevo valor para *${FIELDS[st.data.chosenIndex].label}* (actual: "${target[fieldKey] || '—'}")` });
        }

<<<<<<< HEAD
        if (st.data.step === 1) {
            const chosenIndex = st.data.chosenIndex;
            const field = FIELDS[chosenIndex];

            if (field.key === 'age' && !isValidAge(text)) return await sock.sendMessage(chatJid, { text: '❌ Edad inválida. Un guerrero debe tener entre 13 y 120 lunas.' });
            if (field.key === 'alias' && !isValidAlias(text)) return await sock.sendMessage(chatJid, { text: '❌ Alias inválido. Usa 2–20 caracteres (letras, números, guiones o puntos).' });
            if (field.key === 'email' && !isValidEmail(text)) return await sock.sendMessage(chatJid, { text: '❌ Formato de correo inválido.' });

            st.data.newValue = field.key === 'age' ? Number(text) : text;
            st.data.step = 2;
            State.set(chatJid, userJid, st);

            return await showSummary(sock, chatJid, target, field, st.data.newValue);
        }

=======
        // Paso 1: Esperando el nuevo valor
        if (st.data.step === 1) {
            const chosenIndex = st.data.chosenIndex;
            const field = FIELDS[chosenIndex].key;

            if (field === 'age' && !isValidAge(text)) return await sock.sendMessage(chatJid, { text: '❌ Edad inválida. Debe ser un número entre 13 y 120.' });
            if (field === 'alias' && !isValidAlias(text)) return await sock.sendMessage(chatJid, { text: '❌ Alias inválido. Usa 2–20 caracteres de letras, números, guiones o puntos.' });
            if (field === 'email' && !isValidEmail(text)) return await sock.sendMessage(chatJid, { text: '❌ Formato de correo inválido.' });

            st.data.newValue = field === 'age' ? Number(text) : text;
            st.data.step = 2;
            State.set(chatJid, userJid, st);

            return await showSummary(sock, chatJid, target, FIELDS[chosenIndex].label, st.data.newValue);
        }

        // Paso 2: Esperando la confirmación
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        if (st.data.step === 2) {
            if (textLower === 'si') {
                const chosenIndex = st.data.chosenIndex;
                const field = FIELDS[chosenIndex].key;
                const newValue = st.data.newValue;
                const oldValue = target[field] || null;

                target[field] = newValue;
                DB.insertOrUpdateUser(target);

<<<<<<< HEAD
=======
                // Registrar el cambio en el historial
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
                DB.db.prepare(`
                    INSERT INTO user_history(user_phone, field, old_value, new_value, changed_by, timestamp)
                    VALUES(?, ?, ?, ?, ?, ?);
                `).run(target.user_phone, field, oldValue, newValue, userJid, new Date().toISOString());

                State.clear(chatJid, userJid);
                return await showFinalProfile(sock, chatJid, target);

            } else if (textLower === 'no') {
                State.clear(chatJid, userJid);
<<<<<<< HEAD
                return await sock.sendMessage(chatJid, { text: '✖️ Alteración cancelada.' });
=======
                return await sock.sendMessage(chatJid, { text: '✖️ Cambio cancelado.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            } else {
                return await sock.sendMessage(chatJid, { text: 'Respuesta no válida. Por favor, responde "Si" o "No".' });
            }
        }
    }
};