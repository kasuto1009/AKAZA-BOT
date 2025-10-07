// commands/group-settings.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

// La lista de configuraciones disponibles
const settingsCommands = {
    welcome: {
        name: 'welcome',
        description: 'Activa o desactiva los mensajes de bienvenida.',
    },
    antilink: {
        name: 'antilink',
        description: 'Activa o desactiva el anti-enlaces de WhatsApp.',
    },
    antilink2: {
        name: 'antilink2',
        description: 'Activa o desactiva el anti-enlaces generales (YouTube, Facebook, etc.).',
    },
    antitoxic: {
        name: 'antitoxic',
        description: 'Activa o desactiva la protección contra malas palabras.',
    },
    modeadmin: {
        name: 'modeadmin',
        description: 'Activa o desactiva el modo "solo administradores".',
    },
    // Puedes añadir más configuraciones aquí si lo necesitas
};

// --- FUNCIÓN HELPER PARA CREAR LOS COMANDOS ---
function createSettingCommand(settingConfig) {
    return {
        name: settingConfig.name,
        alias: [], // Puedes añadir alias si quieres, ej: ['bienvenida']
        description: settingConfig.description,
        adminOnly: true, // Todos estos comandos son solo para admins de grupo
        execute: async (sock, msg, args, ctx) => {
            const { chatJid, userJid, isGroup } = ctx;

            if (!isGroup) {
                return sock.sendMessage(chatJid, { text: '❌ Este comando solo se puede usar en grupos.' });
            }

            try {
                // Verificación de permisos DENTRO del grupo usando Baileys
                const metadata = await sock.groupMetadata(chatJid);
                
                // =================================================================
                // CORRECCIÓN: Verificación de admin robusta para LIDs y JIDs
                // Se busca al usuario por su JID en las propiedades 'id' y 'jid' del participante.
                // =================================================================
                const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));

                if (!userParticipant?.admin) {
                    return sock.sendMessage(chatJid, { text: '🚫 Solo los administradores de este grupo pueden cambiar la configuración.' });
                }

                const action = args[0]?.toLowerCase();

                if (!['on', 'off', 'activar', 'desactivar'].includes(action)) {
                    // Si no se da una acción, mostrar el estado actual
                    const currentSettings = DB.getChatSettings(chatJid);
                    const status = currentSettings[settingConfig.name] ? '✅ Activado' : '❌ Desactivado';
                    return sock.sendMessage(chatJid, { text: `⚙️ *${settingConfig.name}* está actualmente ${status}\n\nUso: \`${PREFIX}${settingConfig.name} on\` o \`${PREFIX}${settingConfig.name} off\`` });
                }

                const newValue = ['on', 'activar'].includes(action);
                DB.setChatSetting(chatJid, settingConfig.name, newValue);

                const statusText = newValue ? '✅ Activado' : '❌ Desactivado';
                return sock.sendMessage(chatJid, { text: `⚙️ La configuración *${settingConfig.name}* ha sido ${statusText}.` });

            } catch (error) {
                console.error(`[ERROR EN ${settingConfig.name}]`, error);
                await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al procesar la configuración.' });
            }
        }
    };
}

// --- GENERAMOS Y EXPORTAMOS TODOS LOS COMANDOS ---
const exportedCommands = {};
for (const key in settingsCommands) {
    exportedCommands[key] = createSettingCommand(settingsCommands[key]);
}

// Usamos module.exports para exportar los comandos generados
module.exports = exportedCommands;