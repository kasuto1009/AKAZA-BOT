<<<<<<< HEAD
// commands/perfil.js (VERSIÓN "KATANA DEMONIACA" - MICROECONOMÍA)

const DB = require('../core/db.js');
const axios = require('axios');
const chalk = require('chalk'); // Para logs de error

const OWNER_NUMBER = process.env.OWNER_NUMBER;
const PREFIX = process.env.PREFIX || '!';

// --- Función Helper para descargar imágenes ---
async function downloadBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error(chalk.red("Error al descargar la imagen:", error.message));
        return null;
    }
}

// Helper para formatear números con comas (ej: 1,000)
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

module.exports = {
    name: 'perfil',
    alias: ['miinfo', 'yo', 'profile', 'info'],
    description: 'Revela el pergamino de un guerrero, mostrando su honor, sus IDs y su riqueza.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { prefix, chatJid, userJid } = ctx;
        let targetJid = userJid;

        try {
            // --- Lógica para buscar el pergamino de OTRO guerrero ---
            if (args.length > 0) {
                const isAdmin = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
                if (!isAdmin) {
                    return await sock.sendMessage(chatJid, { text: '👹 Solo un Hashira o una Luna Superior pueden consultar los pergaminos de otros guerreros.' });
                }

                // Lógica de identificación de target (mantenida y limpia)
                const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const quotedUser = msg.message?.extendedTextMessage?.contextInfo?.participant;
                const identifier = args.join(' ');

                // Usamos la función universal getUserAny de DB.js para buscar por alias, número o JID
                const foundUser = DB.getUserAny(mentionedJid || quotedUser || identifier);

                if (foundUser) {
                    targetJid = `${foundUser.user_phone}@s.whatsapp.net`;
                } else if (identifier.match(/^\d+$/)) {
                    // Si solo es un número, lo intenta usar como número de teléfono
                    targetJid = `${DB.normalizePhone(identifier)}@s.whatsapp.net`;
                } else {
                    return await sock.sendMessage(chatJid, { text: `❌ No se encontró ningún guerrero con el alias/ID/número "${identifier}".` });
                }
            }

            const targetPhone = targetJid.split('@')[0];
            const targetUser = DB.getUserByPhone(targetPhone);

            if (!targetUser) {
                const notRegisteredText = (targetJid === userJid)
                    ? `👹 Aún no has forjado tu leyenda.\nPara inscribirte en el pergamino, usa *${prefix}registrar*.`
                    : `❌ El guerrero @${targetPhone} no se encuentra en el pergamino.`;
                return await sock.sendMessage(chatJid, { text: notRegisteredText, mentions: [targetJid] });
            }

            let profilePicBuffer;
            try {
                const url = await sock.profilePictureUrl(targetJid, 'image');
                if (url) {
                    profilePicBuffer = await downloadBuffer(url);
                }
            } catch (e) {
                console.log(chalk.yellow(`No se pudo obtener la foto de WhatsApp para ${targetJid}.`));
            }
            
            // --- GENERACIÓN DEL PERFIL CON NUEVOS DATOS ---
            const isAdminText = DB.isAdmin(targetPhone) ? `\n┫ ⚔️ *Rango:* Hashira del Bot (Admin)` : '';
            const registrationDate = new Date(targetUser.created_at).toLocaleString('es-EC');

            // Formato de monedas para legibilidad
            const formattedCoins = formatNumber(targetUser.coins || 0);

            const infoText = 
`╪══════ 👹 ══════╪
    *~ Pergamino del Guerrero ~*

┫ 👤 *Alias:* ${targetUser.alias}
┫ 🥇 *Rol:* ${targetUser.rol_user} ${isAdminText}
┫ 🎂 *Lunas Vividas:* ${targetUser.age}
┫ 🌍 *Clan de Origen:* ${targetUser.country}
╪════ 💎 RIQUEZA ════╪
┫ 💰 *Monedas (Coins):* ${formattedCoins}
┫ 💳 *ID:* ${targetUser.wallet_id || 'N/A'}
┫ 🏷️ *ID Compra:* ${targetUser.purchase_id || 'N/A'}
╪════ •| ✧ |• ════╪
┫ 🕒 *Inscripción:* ${registrationDate}
💡 Usa *${prefix}editar* para alterar tu pergamino.`;

            if (profilePicBuffer) {
                await sock.sendMessage(chatJid, {
                    image: profilePicBuffer,
                    caption: infoText,
                    mentions: [targetJid]
                });
            } else {
                const textOnlyMessage = 
`🖼️ *Retrato del guerrero no encontrado.*
${infoText}`;
                await sock.sendMessage(chatJid, {
                    text: textOnlyMessage,
                    mentions: [targetJid]
                });
            }

        } catch (error) {
            console.error(chalk.red('[PERFIL ERROR]'), error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar leer el pergamino del guerrero.' });
        }
    }
=======
// commands/perfil.js (VERSIÓN COMMONJS - CORREGIDA)

const DB = require('../core/db.js');
const axios = require('axios');

const OWNER_NUMBER = process.env.OWNER_NUMBER;
const PREFIX = process.env.PREFIX || '!';

// --- Función Helper para descargar imágenes en un buffer ---
async function downloadBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error("Error al descargar la imagen:", error.message);
        // Devolvemos null para manejar el error más adelante
        return null;
    }
}

module.exports = {
    name: 'perfil',
    alias: ['miinfo', 'yo', 'profile'],
    description: 'Muestra tu perfil de usuario o el de otra persona.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { prefix, chatJid, userJid } = ctx;
        let targetJid = userJid; // Por defecto, el perfil es el del propio usuario

        try {
            // --- Lógica para buscar el perfil de OTRO usuario ---
            if (args.length > 0) {
                const isAdmin = userJid === OWNER_NUMBER || DB.isAdmin(userJid.split('@')[0]);
                if (!isAdmin) {
                    return await sock.sendMessage(chatJid, { text: '❌ Solo los administradores del bot pueden ver perfiles de otros usuarios.' });
                }

                const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const quotedUser = msg.message?.extendedTextMessage?.contextInfo?.participant;
                const numberArg = args[0].replace(/\D/g, '');

                if (mentionedJid) {
                    targetJid = mentionedJid;
                } else if (quotedUser) {
                    targetJid = quotedUser;
                } else if (numberArg) {
                    targetJid = `${numberArg}@s.whatsapp.net`;
                } else {
                    // Búsqueda por alias como último recurso
                    const foundUser = DB.getUserByAlias(args.join(' ').toLowerCase());
                    if (!foundUser) {
                        return await sock.sendMessage(chatJid, { text: `❌ No se encontró ningún usuario con el alias "${args.join(' ')}".` });
                    }
                    targetJid = `${foundUser.user_phone}@s.whatsapp.net`;
                }
            }

            // --- Obtenemos los datos del usuario de la DB ---
            const targetPhone = targetJid.split('@')[0];
            const targetUser = DB.getUserByPhone(targetPhone);

            if (!targetUser) {
                const notRegisteredText = (targetJid === userJid)
                    ? `🔐 Aún no estás registrado.\nPara crear tu perfil, usa *${prefix}registrar* 🚀`
                    : `❌ El usuario @${targetPhone} no está registrado.`;
                return await sock.sendMessage(chatJid, { text: notRegisteredText, mentions: [targetJid] });
            }

            // --- Lógica para obtener la foto de perfil ---
            let profilePicBuffer;
            try {
                const url = await sock.profilePictureUrl(targetJid, 'image');
                if (url) {
                    profilePicBuffer = await downloadBuffer(url);
                }
            } catch (e) {
                console.log(`No se pudo obtener la foto de WhatsApp para ${targetJid}, se enviará solo texto.`);
            }
            
            // --- Construcción del mensaje de perfil ---
            const isAdminText = DB.isAdmin(targetPhone) ? '\n⭐ *Rol:* Administrador del Bot' : '';
            const registrationDate = new Date(targetUser.created_at).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });

            const infoText = 
`🧾 *Perfil de ${targetUser.alias}*
━━━━━━━━━━━━━
👤 *Nombre:* ${targetUser.name}
🎂 *Edad:* ${targetUser.age}
🌍 *País:* ${targetUser.country}${isAdminText}
📅 *Registrado desde:* ${registrationDate}

💡 Usa *${prefix}editar* para modificar tu perfil.`;

            // --- Envío del perfil con o sin la imagen ---
            if (profilePicBuffer) {
                // Si se encontró la foto, se envía con la imagen
                await sock.sendMessage(chatJid, {
                    image: profilePicBuffer,
                    caption: `🌟 ━━━━━ ✦ ━━━━━ 🌟\n${infoText}\n🌟 ━━━━━ ✦ ━━━━━ 🌟`,
                    mentions: [targetJid]
                });
            } else {
                // Si no se encontró la foto, se envía solo texto con una nota adicional
                const textOnlyMessage = 
`🌟 ━━━━━ ✦ ━━━━━ 🌟
🖼️ *Foto de perfil no encontrada.*
━━━━━━━━━━━━━
${infoText}
🌟 ━━━━━ ✦ ━━━━━ 🌟`;
                await sock.sendMessage(chatJid, {
                    text: textOnlyMessage,
                    mentions: [targetJid]
                });
            }

        } catch (error) {
            console.error('[PERFIL ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar mostrar el perfil.' });
        }
    }
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};