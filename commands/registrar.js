<<<<<<< HEAD
// commands/registrar.js (VERSIÓN "KATANA DEMONIACA" - REGISTRO COMPLETO DE ROL/IDS)

const { v4: uuidv4 } = require('uuid');
const DB = require('../core/db.js');
const State = require('../core/state.js');
const axios = require('axios');
const chalk = require('chalk');
const Utils = require('../core/utils'); // 🔥 IMPORTADO para generación de IDs


// --- Funciones de validación ---
const isValidAge = x => { const n = Number(x); return Number.isInteger(n) && n >= 13 && n <= 120; };
const isValidAlias = x => /^[\w\-.]{2,20}$/.test(x);

// --- Función Helper para descargar imágenes ---
async function downloadBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error(chalk.red("Error al descargar la imagen de perfil:", error.message));
        return null;
    }
}

// --- Funciones Helper con Diseño "Katana Demoníaca" ---
async function askNext(sock, chatJid, state) {
    const { step, data } = state;
    const questions = [
        `┫ 📝 Escribe tu *nombre real*${data.name ? `\n┃    (Sugerencia: ${data.name})` : ''}`,
        `┫ 🎂 Ahora, dime cuántas *lunas has vivido* (edad)\n┃    (Debe ser un número entre 13 y 120)`,
        `┫ 🌍 ¿Cuál es tu *clan de origen* (país)?`,
        `┫ 👹 Elige tu *alias de guerrero*\n┃    (2-20 caracteres, sin espacios)`,
        `┫ 📧 Escribe tu *correo electrónico*\n┃    (Opcional, puedes escribir "omitir")`,
    ];

    if (step < questions.length) {
        return sock.sendMessage(chatJid, { text: questions[step] });
    }

    if (step === 5) {
        const summary = 
`╪══════ 👹 ══════╪
    *~ Confirmación del Pacto ~*

Confirma los datos que serán inscritos en tu pergamino:

┫ 👹 *Alias:* ${data.alias}
┫ 👤 *Nombre:* ${data.name}
┫ 🎂 *Lunas Vividas:* ${data.age}
┫ 🌍 *Clan de Origen:* ${data.country}
┫ 📧 *Correo:* ${data.email || 'No proporcionado'}

¿Son correctos estos datos? Responde *Si* o *No*.
╪═══════ •| ✧ |• ═══════╪`;
        return sock.sendMessage(chatJid, { text: summary });
    }
}

module.exports = {
    name: 'registrar',
    alias: ['registro', 'register', 'reg', 'rg', 'sign'],
    description: 'Forja tu leyenda inscribiéndote en el pergamino sagrado del clan.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        // ctx.rawPhoneNumber contiene el número de teléfono universal sin sufijo (ej: 51994729892)
        const { chatJid, userJid, isGroup, prefix, rawPhoneNumber } = ctx; 

        if (isGroup) {
            return sock.sendMessage(chatJid, { text: `👹 Para forjar tu leyenda, debes invocar la técnica \`${prefix}registrar\` en privado.` });
        }
        
        // 🚨 CORRECCIÓN 1: Usamos rawPhoneNumber para verificar si ya está registrado
        if (DB.getUserByPhone(rawPhoneNumber)) { 
            return sock.sendMessage(chatJid, { text: `✅ Tu leyenda ya ha sido escrita en el pergamino. Usa *${prefix}perfil* para consultarla.` });
        }

        if (State.inProgress(chatJid, userJid)) {
            return sock.sendMessage(chatJid, { text: `Ya te encuentras en medio de un ritual de inscripción. Escribe *cancelar* para abandonar.` });
        }

        // 🚨 CORRECCIÓN 2: Guardamos el rawPhoneNumber en el estado inicial
        const initialData = { user_phone: rawPhoneNumber, name: msg.pushName || '' }; 
        const st = { flow: 'registrar', step: 0, data: initialData };
        State.set(chatJid, userJid, st);

        const welcomeMessage = 
`╪══════ 👹 ══════╪
    *~ Ritual de Inscripción ~*

¡Bienvenido, aspirante! Es hora de forjar tu leyenda en el pergamino sagrado.
Puedes escribir *cancelar* en cualquier momento para abandonar el ritual.
╪═══════ •| ✧ |• ═══════╪`;
        await sock.sendMessage(chatJid, { text: welcomeMessage });
        await askNext(sock, chatJid, st);
    },

    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid, prefix } = ctx;
        const st = State.get(chatJid, userJid);

        if (!st || st.flow !== 'registrar') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const textLower = text.toLowerCase();

        if (textLower === 'cancelar') {
            State.clear(chatJid, userJid);
            return sock.sendMessage(chatJid, { text: `✖️ Ritual de inscripción cancelado. Puedes reiniciarlo con *${prefix}registrar*.` });
        }

        const steps = [
            (st, text) => { if (text.length < 2 || text.length > 30) return sock.sendMessage(chatJid, { text: `❌ Nombre inválido. Tu nombre debe tener entre 2 y 30 caracteres.` }); st.data.name = text; },
            (st, text) => { if (!isValidAge(text)) return sock.sendMessage(chatJid, { text: `❌ Edad inválida. Un guerrero debe tener entre 13 y 120 lunas.` }); st.data.age = Number(text); },
            (st, text) => { if (text.length < 2) return sock.sendMessage(chatJid, { text: `❌ Clan de Origen inválido.` }); st.data.country = text; },
            (st, text) => { if (!isValidAlias(text)) return sock.sendMessage(chatJid, { text: `❌ Alias inválido (2-20 caracteres, sin espacios).` }); 
                            if (DB.getUserByAlias(text)) { return sock.sendMessage(chatJid, { text: `❌ El alias "${text}" ya ha sido reclamado por otro guerrero. Elige un nuevo nombre de batalla.` }); } st.data.alias = text; },
            (st, text) => { if (['omitir', 'no', 'skip'].includes(textLower)) { st.data.email = null; } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) { return sock.sendMessage(chatJid, { text: `❌ Correo inválido. Ingresa un correo válido o escribe "omitir".` }); } else { st.data.email = text; } },
            
            async (st, text) => {
                if (textLower === 'si') {
                    
                    // **********************************************
                    // 🔥 GENERACIÓN Y ASIGNACIÓN DE IDS ÚNICOS
                    // **********************************************
                    let walletId;
                    let purchaseId;

                    // 1. Generar Wallet ID (Numérico 5 dígitos)
                    // La verificación de unicidad usa DB.getUserByWalletId (que creamos en db.js)
                    do {
                        walletId = Utils.generateWalletId();
                    } while (DB.getUserByWalletId && DB.getUserByWalletId(walletId)); 

                    // 2. Generar Purchase ID (Alfanumérico)
                    // La verificación de unicidad usa DB.getUserByPurchaseId (que creamos en db.js)
                    do {
                        purchaseId = Utils.generatePurchaseId();
                    } while (DB.getUserByPurchaseId && DB.getUserByPurchaseId(purchaseId)); 
                    
                    const userData = {
                        user_phone: st.data.user_phone, 
                        internal_id: uuidv4(),
                        
                        // 🔥 CAMPOS NUEVOS
                        rol_user: 'Aspirante', // Rol por defecto
                        wallet_id: walletId,    
                        purchase_id: purchaseId, 
                        // 🔥 FIN CAMPOS NUEVOS
                        
                        name: st.data.name,
                        age: st.data.age,
                        country: st.data.country,
                        alias: st.data.alias,
                        email: st.data.email,
                        created_at: new Date().toISOString()
                    };

                    try {
                        DB.insertOrUpdateUser(userData);
                        State.clear(chatJid, userJid);

                        let profilePicBuffer;
                        try {
                            const url = await sock.profilePictureUrl(userJid, 'image');
                            if (url) profilePicBuffer = await downloadBuffer(url);
                        } catch (e) {
                             console.warn(chalk.yellow(`[PROFILE PIC] Fallo al descargar foto para ${st.data.user_phone}: ${e.message}`));
                        }

                        const registrationDate = new Date(userData.created_at).toLocaleString('es-EC');
                        const infoText = 
`╪══════ 👹 ══════╪
    *~ Leyenda Forjada ~*

¡Bienvenido al clan, *${userData.alias}*!
Tu leyenda ha sido inscrita exitosamente en el pergamino sagrado.

┫ 🥇 *Rol:* ${userData.rol_user}
┫ 💳 *ID:* ${userData.wallet_id} 
┫ 🏷️ *ID Compra:* ${userData.purchase_id}
┫ 👤 *Nombre:* ${userData.name}
┫ 🎂 *Lunas Vividas:* ${userData.age}
┫ 🌍 *Clan de Origen:* ${userData.country}
┫ 🕒 *Inscripción:* ${registrationDate}
╪══════ •| ✧ |• ══════╪`;

                        if (profilePicBuffer) {
                            await sock.sendMessage(chatJid, { image: profilePicBuffer, caption: infoText });
                        } else {
                            await sock.sendMessage(chatJid, { text: `${infoText}\n\n🖼️ _Tu retrato no pudo ser capturado._` });
                        }
                        
                    } catch (dbError) {
                        console.error(chalk.red("[DB INSERT ERROR]"), dbError);
                        State.clear(chatJid, userJid);
                        await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al forjar tu leyenda. Es posible que el alias ya esté en uso o que la base de datos no esté configurada para los IDs.' });
                    }
                    
                    return true;

                } else if (textLower === 'no') {
                    State.clear(chatJid, userJid);
                    await sock.sendMessage(chatJid, { text: `✖️ Inscripción cancelada.` });
                    return true;
                } else {
                    return sock.sendMessage(chatJid, { text: `Respuesta no válida. Confirma con *si* o cancela con *no*.` });
                }
            }
        ];
        
        const currentStepHandler = steps[st.step];
        const result = await currentStepHandler(st, text);
        
        if (result) return;

        st.step++;
        State.set(chatJid, userJid, st);
        await askNext(sock, chatJid, st);
    }
=======
// commands/registrar.js (VERSIÓN COMMONJS - CON DOBLE CHEQUEO DE DB)

const { v4: uuidv4 } = require('uuid');
const DB = require('../core/db.js');
const State = require('../core/state.js');
const axios = require('axios');

// --- Funciones de validación ---
const isValidAge = x => { const n = Number(x); return Number.isInteger(n) && n >= 13 && n <= 120; };
const isValidAlias = x => /^[\w\-.]{2,20}$/.test(x);

// --- Función Helper para descargar imágenes ---
async function downloadBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error al descargar la imagen:", error.message);
        return null;
    }
}

// --- Función para hacer la siguiente pregunta del flujo ---
async function askNext(sock, chatJid, state) {
    const { step, data } = state;
    const questions = [
        `🌟 ¡Qué gusto tenerte aquí! Vamos a crear tu perfil.\n\n👉 Escribe tu *nombre real*${data.name ? ` (Sugerencia: ${data.name})` : ''}`,
        `🎂 Ahora, dime tu *edad* (debe ser un número entre 13 y 120)`,
        `🌍 ¿De qué *país* eres?`,
        `😎 Elige un *alias* único (de 2 a 20 caracteres, sin espacios)`,
        `📧 Escribe tu *correo electrónico* (opcional, puedes escribir *omitir*)`,
    ];

    if (step < questions.length) {
        return sock.sendMessage(chatJid, { text: questions[step] });
    }

    if (step === 5) {
        const summary = `✨ *Resumen de tu registro* ✨
━━━━━━━━━━━━━
👤 *Nombre:* ${data.name}
🎂 *Edad:* ${data.age}
🌍 *País:* ${data.country}
😎 *Alias:* ${data.alias}
📧 *Correo:* ${data.email || 'No proporcionado'}
━━━━━━━━━━━━━
✅ Confirma escribiendo *si*
❌ Cancela escribiendo *no*`;
        return sock.sendMessage(chatJid, { text: summary });
    }
}

module.exports = {
    name: 'registrar',
    alias: ['registro', 'signup'],
    description: 'Crea un perfil de usuario.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup, prefix } = ctx;

        if (isGroup) {
            return sock.sendMessage(chatJid, { text: `⚠️ Para registrarte, por favor envíame el comando *${prefix}registrar* en un chat privado.` });
        }

        if (State.inProgress(chatJid, userJid)) {
            return sock.sendMessage(chatJid, { text: `Ya estás en un proceso de registro. Escribe *cancelar* para empezar de nuevo.` });
        }

        const userPhone = userJid.split('@')[0];
        if (DB.getUserByPhone(userPhone)) {
            return sock.sendMessage(chatJid, { text: `✅ Ya te encuentras registrado. Usa *${prefix}perfil* para ver tu información.` });
        }

        const initialData = { user_phone: userPhone, name: msg.pushName || '' };
        const st = { flow: 'registrar', step: 0, data: initialData };
        State.set(chatJid, userJid, st);

        await sock.sendMessage(chatJid, { text: `🚀 ¡Iniciando registro! Puedes escribir *cancelar* en cualquier momento.` });
        await askNext(sock, chatJid, st);
    },

    handleStepMessage: async (sock, msg, ctx) => {
        const { chatJid, userJid, prefix } = ctx;
        const st = State.get(chatJid, userJid);

        if (!st || st.flow !== 'registrar') return;

        const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || '').trim();
        const textLower = text.toLowerCase();

        if (textLower === 'cancelar') {
            State.clear(chatJid, userJid);
            return sock.sendMessage(chatJid, { text: `❌ Registro cancelado. Puedes reiniciar con *${prefix}registrar*.` });
        }

        const steps = [
            // Pasos 0-4 (sin cambios)
            (st, text) => { if (text.length < 2 || text.length > 30) return sock.sendMessage(chatJid, { text: `❌ Nombre inválido. Inténtalo de nuevo.` }); st.data.name = text; },
            (st, text) => { if (!isValidAge(text)) return sock.sendMessage(chatJid, { text: `❌ Edad inválida. Debe ser un número entre 13 y 120.` }); st.data.age = Number(text); },
            (st, text) => { if (text.length < 2) return sock.sendMessage(chatJid, { text: `❌ País inválido.` }); st.data.country = text; },
            (st, text) => { if (!isValidAlias(text)) return sock.sendMessage(chatJid, { text: `❌ Alias inválido (2-20 caracteres, sin espacios).` }); if (DB.getUserByAlias(text)) { return sock.sendMessage(chatJid, { text: `❌ Lo siento, el alias "${text}" ya está en uso. Por favor, elige otro.` }); } st.data.alias = text; },
            (st, text) => { if (['omitir', 'no', 'skip'].includes(textLower)) { st.data.email = null; } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) { return sock.sendMessage(chatJid, { text: `❌ Correo inválido. Escribe uno válido o "omitir".` }); } else { st.data.email = text; } },
            
            // Paso 5: Confirmación (MODIFICADO)
            async (st, text) => {
                if (textLower === 'si') {
                    const userData = {
                        user_phone: st.data.user_phone,
                        internal_id: uuidv4(),
                        name: st.data.name,
                        age: st.data.age,
                        country: st.data.country,
                        alias: st.data.alias,
                        email: st.data.email,
                        created_at: new Date().toISOString()
                    };

                    try {
                        // 1. Intentamos guardar el usuario
                        const result = DB.insertOrUpdateUser(userData);

                        // 2. Hacemos el "Doble Chequeo" de seguridad
                        const savedUser = DB.getUserByPhone(userData.user_phone);
                        if (!savedUser) {
                            // Si el usuario no se encuentra después de guardar, lanzamos un error
                            throw new Error("Fallo silencioso al guardar en la base de datos.");
                        }

                        // Si todo fue bien, limpiamos el estado y enviamos el mensaje de éxito
                        State.clear(chatJid, userJid);

                        let profilePicBuffer;
                        try {
                            const url = await sock.profilePictureUrl(userJid, 'image');
                            if (url) profilePicBuffer = await downloadBuffer(url);
                        } catch (e) {
                            console.log(`No se pudo obtener la foto de perfil para ${userJid} al registrar.`);
                        }

                        const registrationDate = new Date(userData.created_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
                        const infoText = `🎉 *¡Registro completado con éxito!*\n━━━━━━━━━━━━━\n🧾 *Perfil de ${userData.alias}*\n👤 *Nombre:* ${userData.name}\n🎂 *Edad:* ${userData.age}\n🌍 *País:* ${userData.country}\n📅 *Registrado:* ${registrationDate}`;

                        if (profilePicBuffer) {
                            await sock.sendMessage(chatJid, { image: profilePicBuffer, caption: `🌟 ━━━━━ ✦ ━━━━━ 🌟\n${infoText}\n\n💡 Usa *${prefix}perfil* para ver tu información completa.\n🌟 ━━━━━ ✦ ━━━━━ 🌟` });
                        } else {
                            await sock.sendMessage(chatJid, { text: `🌟 ━━━━━ ✦ ━━━━━ 🌟\n🖼️ *Foto de perfil no encontrada.*\n━━━━━━━━━━━━━\n${infoText}\n\n💡 Usa *${prefix}perfil* para ver tu información completa.\n🌟 ━━━━━ ✦ ━━━━━ 🌟` });
                        }
                        
                    } catch (dbError) {
                        console.error("[DB INSERT ERROR]", dbError);
                        State.clear(chatJid, userJid);
                        await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al guardar tu registro en la base de datos. Es posible que el alias ya esté en uso. Por favor, intenta registrarte de nuevo.' });
                    }
                    
                    return true;

                } else if (textLower === 'no') {
                    State.clear(chatJid, userJid);
                    await sock.sendMessage(chatJid, { text: `❌ Registro cancelado.` });
                    return true;
                } else {
                    return sock.sendMessage(chatJid, { text: `Respuesta no válida. Confirma con *si* o cancela con *no*.` });
                }
            }
        ];
        
        const currentStepHandler = steps[st.step];
        const result = await currentStepHandler(st, text);
        
        if (result) return;

        st.step++;
        State.set(chatJid, userJid, st);
        await askNext(sock, chatJid, st);
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};