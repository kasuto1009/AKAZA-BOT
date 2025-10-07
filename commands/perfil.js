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
};