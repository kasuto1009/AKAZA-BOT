// commands/editar.js (VERSIÓN COMMONJS)

const DB = require('../core/db');
const State = require('../core/state');
const axios = require('axios');
const moment = require('moment-timezone');
const ct = require('countries-and-timezones');

const OWNER_NUMBER = process.env.OWNER_NUMBER; // Formato JID: 593...@s.whatsapp.net

// --- Funciones de validación ---
function isValidAge(x) { const n = Number(x); return Number.isInteger(n) && n >= 13 && n <= 120; }
function isValidAlias(x) { return /^[\w\-.]{2,20}$/.test(String(x || '')); }
function isValidEmail(x) { if (!x) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }

const FIELDS = [
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
}

async function showSummary(sock, chatJid, target, field, newValue) {
    const userIdentifier = target.alias || target.user_phone;
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
    await sock.sendMessage(chatJid, { text: summary });
}

async function showFinalProfile(sock, chatJid, target) {
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
    await sock.sendMessage(chatJid, { text: profile });
}

// --- Lógica Principal del Comando ---
module.exports = {
    name: 'editar',
    alias: ['edit'],
    description: 'Editar el perfil de un usuario (admin/owner puede editar a otros).',
    public: true,
    adminOnly: true, // Lógica de permisos reforzada internamente

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        let targetJid;
        if (args.length > 0) {
            const targetPhone = args[0].replace(/\D/g, '');
            targetJid = `${targetPhone}@s.whatsapp.net`;
        } else {
            targetJid = userJid;
        }

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
            return await sock.sendMessage(chatJid, { text: '✖️ Edición cancelada.' });
        }

        // Paso 0: Esperando la selección del campo
        if (st.data.step === 0) {
            const sel = Number(text);
            if (isNaN(sel) || sel < 1 || sel > FIELDS.length) {
                return await sock.sendMessage(chatJid, { text: 'Selección inválida. Responde con un número del menú.' });
            }

            st.data.chosenIndex = sel - 1;
            st.data.step = 1;
            State.set(chatJid, userJid, st);
            const fieldKey = FIELDS[st.data.chosenIndex].key;
            return await sock.sendMessage(chatJid, { text: `✏️ Ingresa el nuevo valor para *${FIELDS[st.data.chosenIndex].label}* (actual: "${target[fieldKey] || '—'}")` });
        }

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
        if (st.data.step === 2) {
            if (textLower === 'si') {
                const chosenIndex = st.data.chosenIndex;
                const field = FIELDS[chosenIndex].key;
                const newValue = st.data.newValue;
                const oldValue = target[field] || null;

                target[field] = newValue;
                DB.insertOrUpdateUser(target);

                // Registrar el cambio en el historial
                DB.db.prepare(`
                    INSERT INTO user_history(user_phone, field, old_value, new_value, changed_by, timestamp)
                    VALUES(?, ?, ?, ?, ?, ?);
                `).run(target.user_phone, field, oldValue, newValue, userJid, new Date().toISOString());

                State.clear(chatJid, userJid);
                return await showFinalProfile(sock, chatJid, target);

            } else if (textLower === 'no') {
                State.clear(chatJid, userJid);
                return await sock.sendMessage(chatJid, { text: '✖️ Cambio cancelado.' });
            } else {
                return await sock.sendMessage(chatJid, { text: 'Respuesta no válida. Por favor, responde "Si" o "No".' });
            }
        }
    }
};