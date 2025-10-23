<<<<<<< HEAD
// commands/ayuda.js (VERSIÓN MEJORADA POR KAZUTO)
const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER_CLEAN = process.env.OWNER_NUMBER ? String(process.env.OWNER_NUMBER).replace(/[^0-9]/g, '') : '';

const commandEmojis = {
    'registrar': '📝', 'perfil': '👤', 'editar': '✏️', 'borrar': '🗑️',
    'ppt': '🗿', 'dado': '🎲', 'balance': '💰', 'tienda': '🏪', 'topusuarios': '🏆',
    'play': '🎵', 'mp4': '🎥', 'sticker': '🏷️', 'tiktok': '💃', 'tts': '🗣️',
    'ia': '🔮', 'qr': '🔗', 'clima': '🌦️',
    'kick': '👢', 'promote': '⬆️', 'demote': '⬇️', 'hidetag': '📣', 'registrar-grupo': '➕',
    'advertir': '⚠️', 'block': '🚫', 'clear': '🧹', 'listadmins': '👑',
    'welcome': '👋', 'antilink': '🔗', 'antilink2': '🌐', 'antitoxic': '🤬', 'modeadmin': '🛡️',
    'status': '📊', 'misgrupos': '⚙️', 'addadmin': '👑'
};

module.exports = {
    name: 'ayuda',
    alias: ['help', 'menu'],
    description: 'Muestra el menú de comandos disponibles o los detalles de un comando específico.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup, prefix, commands } = ctx;

        // 🧮 CONTEO DE USUARIOS
        let totalUsers = 0;
        try {
            if (typeof DB.countUsers === 'function') totalUsers = DB.countUsers();
            else if (typeof DB.getAllUsers === 'function') {
                const users = DB.getAllUsers();
                totalUsers = Array.isArray(users) ? users.length : 0;
            }
        } catch {
            totalUsers = '??';
        }

        const rawPhone = userJid.split('@')[0].replace(/[^0-9]/g, '');
        const isBotOwner = rawPhone === OWNER_NUMBER_CLEAN;
        const isBotAdmin = isBotOwner || DB.isAdmin?.(rawPhone);
        let isGroupAdmin = false;

        if (isGroup) {
            try {
                const metadata = await sock.groupMetadata(chatJid);
                const participant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid));
                if (participant?.admin) isGroupAdmin = true;
            } catch {}
        }

        // 🧠 Si el usuario pidió un comando específico
        if (args.length > 0) {
            const commandName = args[0].toLowerCase();
            const cmd = commands.get(commandName) || [...commands.values()].find(c => c.alias?.includes(commandName));

            if (!cmd) return sock.sendMessage(chatJid, { text: `❌ El comando "${commandName}" no fue encontrado.` });

            let msgDetail = `╪•| *DETALLES DEL COMANDO* |•╪\n\n┫ ${commandEmojis[cmd.name] || '👹'} *Comando:* \`${prefix}${cmd.name}\`\n`;
            if (cmd.alias?.length > 0) msgDetail += `┫ ✨ *Alias:* ${cmd.alias.join(', ')}\n`;
            msgDetail += `┫ 📝 *Descripción:* ${cmd.description}\n\n╪═══════ 👹 ═══════╪`;

            return sock.sendMessage(chatJid, { text: msgDetail });
        }

        // 🔥 CATEGORÍAS ORDENADAS Y CLARAS
        const categories = {
            info_base: { name: 'Registro y Perfil', emoji: '📝', commands: [] },
            entretenimiento: { name: 'Juegos y Diversión', emoji: '🎮', commands: [] },
            multimedia: { name: 'Multimedia y Descargas', emoji: '🎧', commands: [] },
            ia_utils: { name: 'IA y Utilidades', emoji: '🤖', commands: [] },
            economia: { name: 'Economía y Ranking', emoji: '💰', commands: [] },
            mod_grupo: { name: 'Moderación de Grupo', emoji: '🛡️', commands: [] },
            owner: { name: 'Comandos del Dueño', emoji: '👑', commands: [] }
        };

        for (const cmd of commands.values()) {
            if (cmd.name === 'ayuda') continue;

            // Registro y perfil
            if (['registrar', 'perfil', 'editar', 'borrar'].includes(cmd.name))
                categories.info_base.commands.push(cmd);

            // Juegos
            else if (['ppt', 'dado'].includes(cmd.name))
                categories.entretenimiento.commands.push(cmd);

            // Multimedia
            else if (['play', 'mp4', 'tiktok', 'sticker', 'tts'].includes(cmd.name))
                categories.multimedia.commands.push(cmd);

            // IA y utilidades
            else if (['ia', 'clima', 'qr'].includes(cmd.name))
                categories.ia_utils.commands.push(cmd);

            // Economía
            else if (['balance', 'tienda', 'topusuarios'].includes(cmd.name))
                categories.economia.commands.push(cmd);

            // Moderación
            else if (['kick', 'promote', 'demote', 'advertir', 'block', 'clear', 'hidetag', 'welcome', 'antilink', 'antitoxic', 'modeadmin', 'listadmins'].includes(cmd.name))
                categories.mod_grupo.commands.push(cmd);

            // Dueño
            else if (['status', 'misgrupos', 'addadmin', 'registrar-grupo', 'deladmin', 'adminlist'].includes(cmd.name))
                categories.owner.commands.push(cmd);
        }

        // 💬 Construcción del menú
        let menu = `╪══════ 👹 ══════╪
     *MENÚ DE AKAZA*
     *~Técnica de Sangre: Llamas Carmesí~*

🔥 *Usuarios Registrados:* ${totalUsers}
${isBotOwner ? '👑 *Modo:* DUEÑO DEL INFIERNO' : isBotAdmin ? '👑 *Modo:* HASHIRA DEL BOT' : isGroupAdmin ? '🛡️ *Modo:* ADMIN DE GRUPO' : '👤 *Modo:* USUARIO'}

`;

        for (const key in categories) {
            const cat = categories[key];
            if (key === 'owner' && !isBotOwner) continue;
            if (key === 'mod_grupo' && !isGroupAdmin && !isBotAdmin && !isBotOwner) continue;

            if (cat.commands.length > 0) {
                menu += `┫ ${cat.emoji} *${cat.name}*\n`;
                for (const cmd of cat.commands) {
                    menu += `┃  ${commandEmojis[cmd.name] || '🔹'} \`${prefix}${cmd.name}\`\n`;
                }
                menu += '╪════ •| ✧ |• ════╪\n';
            }
        }

        menu += `\n_Para ver detalles de un comando, usa ${prefix}ayuda <comando>_\n╪══════ 👹 ══════╪`;

        await sock.sendMessage(chatJid, { text: menu.trim() });
    }
};
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
