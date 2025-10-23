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
