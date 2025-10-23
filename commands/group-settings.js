// commands/group-settings.js (VERSIÓN "KATANA DEMONIACA")

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

// La lista de configuraciones disponibles con descripciones temáticas
const settingsCommands = {
    welcome: {
        name: 'welcome',
        description: 'Activa o desactiva el saludo ceremonial para nuevos guerreros.',
    },
    antilink: {
        name: 'antilink',
        description: 'Activa o desactiva el sello contra invitaciones a otros clanes.',
    },
    antilink2: {
        name: 'antilink2',
        description: 'Activa o desactiva el sello contra portales a otros mundos (enlaces externos).',
    },
    antitoxic: {
        name: 'antitoxic',
        description: 'Activa o desactiva el sello contra el lenguaje deshonroso.',
    },
    modeadmin: {
        name: 'modeadmin',
        description: 'Activa o desactiva el estado de alerta donde solo los Hashira pueden hablar.',
    },
};

// --- FUNCIÓN HELPER PARA CREAR LOS COMANDOS CON ESTILO ---
function createSettingCommand(settingConfig) {
    return {
        name: settingConfig.name,
        alias: [],
        description: settingConfig.description,
        adminOnly: true,
        execute: async (sock, msg, args, ctx) => {
            const { chatJid, userJid, isGroup } = ctx;

            if (!isGroup) {
                return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo puede ser ejecutada en el campo de batalla (grupos).' });
            }

            try {
                const metadata = await sock.groupMetadata(chatJid);
                const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));

                if (!userParticipant?.admin) {
                    return sock.sendMessage(chatJid, { text: '👹 Solo un Hashira puede alterar el pergamino de reglas del grupo.' });
                }

                const action = args[0]?.toLowerCase();

                if (!['on', 'off', 'activar', 'desactivar'].includes(action)) {
                    const currentSettings = DB.getChatSettings(chatJid);
                    const status = currentSettings[settingConfig.name] ? '✅ Activado' : '❌ Desactivado';
                    const statusMessage =
`╪══════ 👹 ══════╪
    *~ Pergamino de Reglas: ${settingConfig.name} ~*

El estado actual de este sello es: ${status}

┫ *Para activarlo:*
┃   \`${PREFIX}${settingConfig.name} on\`
┫ *Para desactivarlo:*
┃   \`${PREFIX}${settingConfig.name} off\`
╪══════ •| ✧ |• ══════╪`;
                    return sock.sendMessage(chatJid, { text: statusMessage });
                }

                const newValue = ['on', 'activar'].includes(action);
                DB.setChatSetting(chatJid, settingConfig.name, newValue);

                const statusText = newValue ? '✅ Activado' : '❌ Desactivado';
                const confirmationMessage =
`╪══════ 👹 ══════╪
    *~ Sello Modificado ~*

La configuración *${settingConfig.name}* ha sido ${statusText}.
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: confirmationMessage });

            } catch (error) {
                console.error(`[ERROR EN ${settingConfig.name}]`, error);
                await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar modificar el sello.' });
            }
        }
    };
}

// --- GENERAMOS Y EXPORTAMOS TODOS LOS COMANDOS ---
const exportedCommands = {};
for (const key in settingsCommands) {
    exportedCommands[key] = createSettingCommand(settingsCommands[key]);
}

module.exports = exportedCommands;
