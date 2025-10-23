<<<<<<< HEAD
// commands/group-settings.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/group-settings.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const PREFIX = process.env.PREFIX || '!';

<<<<<<< HEAD
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
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        execute: async (sock, msg, args, ctx) => {
            const { chatJid, userJid, isGroup } = ctx;

            if (!isGroup) {
<<<<<<< HEAD
                return sock.sendMessage(chatJid, { text: '👹 Esta técnica solo puede ser ejecutada en el campo de batalla (grupos).' });
            }

            try {
                const metadata = await sock.groupMetadata(chatJid);
                const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));

                if (!userParticipant?.admin) {
                    return sock.sendMessage(chatJid, { text: '👹 Solo un Hashira puede alterar el pergamino de reglas del grupo.' });
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
                }

                const action = args[0]?.toLowerCase();

                if (!['on', 'off', 'activar', 'desactivar'].includes(action)) {
<<<<<<< HEAD
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
=======
                    // Si no se da una acción, mostrar el estado actual
                    const currentSettings = DB.getChatSettings(chatJid);
                    const status = currentSettings[settingConfig.name] ? '✅ Activado' : '❌ Desactivado';
                    return sock.sendMessage(chatJid, { text: `⚙️ *${settingConfig.name}* está actualmente ${status}\n\nUso: \`${PREFIX}${settingConfig.name} on\` o \`${PREFIX}${settingConfig.name} off\`` });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
                }

                const newValue = ['on', 'activar'].includes(action);
                DB.setChatSetting(chatJid, settingConfig.name, newValue);

                const statusText = newValue ? '✅ Activado' : '❌ Desactivado';
<<<<<<< HEAD
                const confirmationMessage =
`╪══════ 👹 ══════╪
    *~ Sello Modificado ~*

La configuración *${settingConfig.name}* ha sido ${statusText}.
╪══════ •| ✧ |• ══════╪`;
                return sock.sendMessage(chatJid, { text: confirmationMessage });

            } catch (error) {
                console.error(`[ERROR EN ${settingConfig.name}]`, error);
                await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar modificar el sello.' });
=======
                return sock.sendMessage(chatJid, { text: `⚙️ La configuración *${settingConfig.name}* ha sido ${statusText}.` });

            } catch (error) {
                console.error(`[ERROR EN ${settingConfig.name}]`, error);
                await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al procesar la configuración.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
            }
        }
    };
}

// --- GENERAMOS Y EXPORTAMOS TODOS LOS COMANDOS ---
const exportedCommands = {};
for (const key in settingsCommands) {
    exportedCommands[key] = createSettingCommand(settingsCommands[key]);
}

<<<<<<< HEAD
module.exports = exportedCommands;
=======
// Usamos module.exports para exportar los comandos generados
module.exports = exportedCommands;
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
