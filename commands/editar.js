// commands/editar.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const State = require('../core/state.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;
const PREFIX = process.env.PREFIX || '!';

// --- Funciones de validación ---
function isValidAge(x) { const n = Number(x); return Number.isInteger(n) && n >= 13 && n <= 120; }
function isValidAlias(x) { return /^[\w\-.]{2,20}$/.test(String(x || '')); }
function isValidEmail(x) { if (!x) return true; return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }

const FIELDS = [
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
}

async function showSummary(sock, chatJid, target, field, newValue) {
    const userIdentifier = target.alias || target.user_phone;
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
    await sock.sendMessage(chatJid, { text: summary });
}

async function showFinalProfile(sock, chatJid, target) {
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
    await sock.sendMessage(chatJid, { text: profile });
}

// --- Lógica Principal del Comando ---
module.exports = {
    name: 'editar',
    alias: ['edit'],
    description: 'Ejecuta una técnica para alterar el pergamino de un guerrero.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        let targetJid;
        if (args.length > 0) {
            const isAllowed = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
            if (!isAllowed) {
                return await sock.sendMessage(chatJid, { text: '👹 Solo un Hashira o una Luna Superior pueden alterar los pergaminos de otros guerreros.' });
            }
            const targetPhone = args[0].replace(/\D/g, '');
            targetJid = `${targetPhone}@s.whatsapp.net`;
        } else {
            targetJid = userJid;
        }

        const target = DB.getUserByPhone(targetJid.split('@')[0]);
        if (!target) return await sock.sendMessage(chatJid, { text: `❌ El guerrero con el número ${targetJid.split('@')[0]} no se encuentra en el pergamino.` });

        State.start(chatJid, userJid, 'editar', { target, step: 0 });
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
            return await sock.sendMessage(chatJid, { text: '✖️ Técnica de alteración cancelada.' });
        }

        if (st.data.step === 0) {
            const sel = Number(text);
            if (isNaN(sel) || sel < 1 || sel > FIELDS.length) {
                return await sock.sendMessage(chatJid, { text: '❌ Selección inválida. Responde con un número del pergamino.' });
            }

            st.data.chosenIndex = sel - 1;
            st.data.step = 1;
            State.set(chatJid, userJid, st);
            const fieldKey = FIELDS[st.data.chosenIndex].key;
            return await sock.sendMessage(chatJid, { text: `✏️ Ingresa el nuevo valor para *${FIELDS[st.data.chosenIndex].label}* (actual: "${target[fieldKey] || '—'}")` });
        }

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

        if (st.data.step === 2) {
            if (textLower === 'si') {
                const chosenIndex = st.data.chosenIndex;
                const field = FIELDS[chosenIndex].key;
                const newValue = st.data.newValue;
                const oldValue = target[field] || null;

                target[field] = newValue;
                DB.insertOrUpdateUser(target);

                DB.db.prepare(`
                    INSERT INTO user_history(user_phone, field, old_value, new_value, changed_by, timestamp)
                    VALUES(?, ?, ?, ?, ?, ?);
                `).run(target.user_phone, field, oldValue, newValue, userJid, new Date().toISOString());

                State.clear(chatJid, userJid);
                return await showFinalProfile(sock, chatJid, target);

            } else if (textLower === 'no') {
                State.clear(chatJid, userJid);
                return await sock.sendMessage(chatJid, { text: '✖️ Alteración cancelada.' });
            } else {
                return await sock.sendMessage(chatJid, { text: 'Respuesta no válida. Por favor, responde "Si" o "No".' });
            }
        }
    }
};