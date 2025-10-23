// events/group-participants.update.js (VERSIÓN MEJORADA + DINÁMICA)

export default async (sock, event, DB) => {
    try {
        const { id, participants, action } = event; // id = groupId
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        // --- CHEQUEO DE DB ---
        if (!DB || typeof DB.getChatSettings !== "function") return;

        // --- REGISTRO AUTOMÁTICO SI EL BOT ES AÑADIDO ---
        if (action === 'add' && participants.includes(botJid)) {
            let metadata = { subject: "Grupo sin nombre" };
            try {
                metadata = await sock.groupMetadata(id);
            } catch (e) {
                console.error("No se pudo obtener metadata del grupo:", e.message);
            }

            DB.registerGroup(id, metadata.subject);
            console.log(`[GRUPO REGISTRADO] Me han añadido a: ${metadata.subject} (${id})`);
            await sock.sendMessage(id, {
                text: `👋 ¡Hola, ${metadata.subject}! Gracias por añadirme. Los administradores pueden usar !ayuda para ver los comandos.`
            });
            return; // No procesar bienvenida para el bot
        }

        // --- CONFIGURACIÓN DE BIENVENIDA/DESPEDIDA ---
        const groupSettings = DB.getChatSettings(id);
        if (!groupSettings || !groupSettings.welcome) return;

        // --- AGRUPAR PARTICIPANTES ---
        const mentions = participants;
        const userNames = participants.map(u => `@${u.split('@')[0]}`);

        if (action === 'add') {
            const welcomeMessage = (groupSettings.welcomeMessage || "🎉 Bienvenid@ @user(s) al grupo @group!")
                .replace("@user(s)", userNames.join(', '))
                .replace("@group", groupSettings.subject || "este grupo");

            await sock.sendMessage(id, { text: welcomeMessage, mentions });
        } else if (action === 'remove') {
            const byeMessage = (groupSettings.byeMessage || "👋 Adiós, @user(s). Te extrañaremos en @group.")
                .replace("@user(s)", userNames.join(', '))
                .replace("@group", groupSettings.subject || "este grupo");

            await sock.sendMessage(id, { text: byeMessage, mentions });
        }

    } catch (error) {
        console.error("Error en el evento de participantes:", error);
    }
};
