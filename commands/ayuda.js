// commands/ayuda.js (VERSIÓN COMMONJS - MEJORADA Y ROBUSTA)

const fs = require('fs');
const path = require('path');
const DB = require('../core/db');

module.exports = {
    name: 'ayuda',
    alias: ['help', 'menu', 'comandos'],
    description: 'Mostrar la lista de comandos disponibles.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup, prefix } = ctx;

        try {
            // --- Carga dinámica de comandos para mantener el menú siempre actualizado ---
            const commandsPath = path.join(__dirname); // __dirname es el directorio actual (commands)
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            // Se definen las categorías
            const categories = {
                'Registro': [],
                'Descargas': [],
                'Administración': [],
                'Herramientas': [],
                'Configuración': [],
                'Información': [],
                'Otros': []
            };

            for (const file of commandFiles) {
                try {
                    const cmd = require(path.join(commandsPath, file));
                    // Si un archivo exporta múltiples comandos (como admin-group.js), los procesamos todos
                    const commandsToProcess = cmd.name ? [cmd] : Object.values(cmd);

                    for (const command of commandsToProcess) {
                        if (!command.name) continue;
                        const cmdInfo = {
                            name: command.name,
                            alias: command.alias || [],
                            description: command.description || 'Sin descripción',
                            adminOnly: command.adminOnly || false,
                            public: command.public !== false
                        };
                        // Lógica de categorización
                        if (['registrar', 'perfil'].includes(command.name)) categories['Registro'].push(cmdInfo);
                        else if (['play', 'tiktok'].includes(command.name)) categories['Descargas'].push(cmdInfo);
                        else if (['kick', 'promote', 'demote', 'hidetag', 'addadmin', 'borrar', 'editar'].includes(command.name)) categories['Administración'].push(cmdInfo);
                        else if (['config'].includes(command.name)) categories['Configuración'].push(cmdInfo);
                        else if (['ia', 'google', 'sticker'].includes(command.name)) categories['Herramientas'].push(cmdInfo);
                        else if (['ayuda'].includes(command.name)) categories['Información'].push(cmdInfo);
                        else categories['Otros'].push(cmdInfo);
                    }
                } catch (error) {
                    console.error(`Error cargando el comando ${file} para el menú:`, error);
                }
            }

            const allCommands = Object.values(categories).flat();

            // --- Ayuda para un comando específico ---
            if (args.length > 0) {
                const requestedCmdName = args[0].toLowerCase();
                const foundCmd = allCommands.find(c => c.name === requestedCmdName || c.alias.includes(requestedCmdName));

                if (foundCmd) {
                    let detailMessage = `📋 *INFORMACIÓN DEL COMANDO*\n\n`;
                    detailMessage += `🔸 *Nombre:* ${foundCmd.name}\n`;
                    if (foundCmd.alias.length > 0) detailMessage += `🔸 *Alias:* ${foundCmd.alias.join(', ')}\n`;
                    detailMessage += `🔸 *Descripción:* ${foundCmd.description}\n`;
                    detailMessage += `🔸 *Uso:* \`${prefix}${foundCmd.name}\``;
                    return sock.sendMessage(chatJid, { text: detailMessage }, { quoted: msg });
                } else {
                    return sock.sendMessage(chatJid, { text: `❌ Comando "${requestedCmdName}" no encontrado.` }, { quoted: msg });
                }
            }

            // --- Construcción del menú principal ---
            const userPhone = userJid.split('@')[0];
            const isRegistered = !!DB.getUserByPhone(userPhone); // Usamos getUserByPhone para consistencia
            
            let helpMessage = `🤖 *${process.env.BOT_NAME || 'AKAZA BOT'} - MENÚ DE AYUDA*\n\n`;
            if (!isRegistered) {
                helpMessage += `⚠️ *No estás registrado.*\nUsa \`${prefix}registrar\` para acceder a todas las funciones.\n\n`;
            }

            let totalUsers = 0;
            try {
                // Se protege la llamada a la base de datos
                totalUsers = DB.db.prepare('SELECT COUNT(*) as count FROM users').get().count;
            } catch (dbError) {
                console.error("Error al contar usuarios:", dbError);
            }

            helpMessage += `📊 *Estadísticas del Bot*\n• Usuarios: ${totalUsers}\n• Comandos: ${allCommands.length}\n• Prefijo: \`${prefix}\`\n\n`;

            for (const [category, commands] of Object.entries(categories)) {
                if (commands.length === 0) continue;
                helpMessage += `*━━ ${category.toUpperCase()} ━━*\n`;
                commands.forEach(cmd => {
                    const adminBadge = cmd.adminOnly ? '👑' : '';
                    helpMessage += ` › \`${prefix}${cmd.name}\`${adminBadge}\n`;
                });
                helpMessage += '\n';
            }

            helpMessage += `💡 _Para ver detalles de un comando, usa:_\n\`${prefix}ayuda <comando>\``;

            // --- Lógica de envío ---
            if (isGroup) {
                // En grupos, se envía un mensaje simple para máxima compatibilidad
                await sock.sendMessage(chatJid, { text: helpMessage });
            } else {
                // En chat privado, se envía un mensaje con vista previa
                const ecuadorTime = new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' });
                helpMessage += `\n\n🕒 ${ecuadorTime}`;
                await sock.sendMessage(chatJid, {
                    text: helpMessage,
                    contextInfo: {
                        externalAdReply: {
                            title: process.env.BOT_NAME || "Akaza Bot",
                            body: `Creado por Kazuto`,
                            mediaType: 1,
                            sourceUrl: "https://github.com/Lemo-san",
                            thumbnailUrl: "https://i.imgur.com/8f2uQfE.jpeg", // URL de imagen actualizada
                            showAdAttribution: false
                        }
                    }
                });
            }

        } catch (error) {
            console.error('[HELP ERROR]', error);
            // Se envía un mensaje de error simple y seguro
            await sock.sendMessage(chatJid, { text: `❌ Ocurrió un error inesperado al mostrar la ayuda.` });
        }
    }
};