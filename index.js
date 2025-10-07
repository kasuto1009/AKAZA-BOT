// =================================================================
// BOT DE WHATSAPP AVANZADO - index.js (VERSIÓN CON GESTIÓN DE GRUPOS Y RESOLUCIÓN DE LIDs MEJORADA)
// =================================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const cfonts = require('cfonts');
const qrcode = require('qrcode-terminal');

// --- Dependencias de Baileys ---
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    jidNormalizedUser
} = require('@whiskeysockets/baileys');

// --- Importaciones de Módulos del Proyecto ---
const State = require('./core/state');
const DB = require('./core/db');
const Protection = require('./libs/protection');

// --- ARRANQUE VISUAL ---
const { say } = cfonts;
say('Akaza Bot', { font: 'block', align: 'center', gradient: ['red', 'magenta'] });
say('Creado por Kazuto', { font: 'console', align: 'center', gradient: ['cyan', 'blue'] });

// --- Variables de Entorno y Constantes ---
const PREFIX = process.env.PREFIX || '!';
const REQUIRE_REG = (process.env.REQUIRE_REGISTRATION || 'true').toLowerCase() === 'true';
const OWNER_NUMBER = process.env.OWNER_NUMBER;

if (!OWNER_NUMBER) {
    console.error(chalk.red('❌ ERROR: La variable OWNER_NUMBER no está definida en el archivo .env.'));
    process.exit(1);
}

// --- STORE EN MEMORIA INTEGRADO ---
const makeInMemoryStore = () => {
    const store = { messages: {}, bind(ev) { ev.on('messages.upsert', ({ messages }) => { for (const msg of messages) { const jid = msg.key.remoteJid; if (!this.messages[jid]) this.messages[jid] = {}; this.messages[jid][msg.key.id] = msg; } }); }, loadMessage(jid, id) { return this.messages[jid]?.[id]; } };
    return store;
};

// --- Helper para obtener el JID del remitente ---
function getInitialUserJid(msg) {
    return jidNormalizedUser(msg.key.participant || msg.participant || msg.key.remoteJid);
}

// --- Carga de Comandos ---
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    console.log(chalk.blue('Cargando comandos...'));
    fs.readdirSync(commandsPath).filter(file => file.endsWith('.js')).forEach(file => {
        try {
            const cmd = require(path.join(commandsPath, file));
            const commandsToLoad = cmd.name ? [cmd] : Object.values(cmd);
            for (const command of commandsToLoad) {
                if (command?.name) {
                    commands.set(command.name, command);
                    console.log(chalk.green(` › Comando cargado: ${command.name}`));
                }
            }
        } catch (error) {
            console.error(chalk.red(`❌ Error cargando el comando ${file}:`), error);
        }
    });
    console.log(chalk.blue(`📦 Comandos cargados (${commands.size})`));
}

// --- Función Principal del Bot ---
async function runBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(chalk.yellow(`Usando Baileys v${version.join('.')}, ¿es la última?: ${isLatest}`));

    const store = makeInMemoryStore();
    const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, version, browser: ['Akaza_bot', 'Safari', '1.0.0'], getMessage: async (key) => store.loadMessage(key.remoteJid, key.id) });
    store.bind(sock.ev);

    // --- MANEJADORES DE EVENTOS ---
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) { qrcode.generate(qr, { small: true }); }
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) setTimeout(runBot, 5000);
        } else if (connection === 'open') {
            console.log(chalk.green('✅ ¡Conexión exitosa!'));
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        try {
            if (!msg || !msg.message || msg.key.fromMe || msg.key.remoteJid === 'status@broadcast') return;

            const chatJid = msg.key.remoteJid;
            const isGroup = chatJid.endsWith('@g.us');
            let userJid = getInitialUserJid(msg); // Puede ser un JID o un LID

            // =================================================================
            // SOLUCIÓN DEFINITIVA PARA COMUNIDADES: Resolver LID a JID ANTES de continuar.
            // =================================================================
            let groupMetadata;
            if (isGroup && userJid.endsWith('@lid')) {
                try {
                    console.log(chalk.yellow(`[LID Detected] Detectado LID: ${userJid}. Resolviendo...`));
                    groupMetadata = await sock.groupMetadata(chatJid);
                    const participant = groupMetadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid));
                    if (participant && participant.jid) {
                        userJid = jidNormalizedUser(participant.jid);
                        console.log(chalk.green(`[LID Resolved] LID resuelto a JID: ${userJid}`));
                    } else {
                        console.log(chalk.red(`[LID Resolve Failed] No se pudo resolver el LID ${userJid}.`));
                        return; // Detenemos la ejecución si no podemos identificar al usuario
                    }
                } catch (metaError) {
                    console.error(chalk.red('Error al resolver LID:'), metaError);
                    return; // Detenemos si hay un error
                }
            }

            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            const args = text.slice(PREFIX.length).trim().split(/\s+/);
            const commandName = (args.shift() || '').toLowerCase();
            const ctx = { prefix: PREFIX, chatJid, userJid, isGroup };
            
            // MEJORA: Verificación de activación del bot en el grupo
            if (isGroup && text.startsWith(PREFIX)) {
                const allowedCommands = ['registrar-grupo', 'activar-bot', 'setup-group']; 
                if (!allowedCommands.includes(commandName)) {
                    if (!DB.isGroupActive(chatJid)) {
                        console.log(chalk.yellow(`[Bot Inactivo] Comando '${commandName}' ignorado en ${chatJid}`));
                        return await sock.sendMessage(chatJid, { text: '❌ Este bot ha sido desactivado para este grupo por el propietario.' });
                    }
                }
            }

            console.log(`${isGroup ? chalk.green('[GRUPO]') : chalk.blue('[PRIVADO]')} ${chalk.yellow(msg.pushName || userJid.split('@')[0])}: ${chalk.white(text)}`);

            // El resto de la lógica continúa con el userJid ya corregido...
            if (isGroup) {
                const protectionResult = await Protection.checkProtections(sock, msg);
                if (protectionResult.violation) {
                    await Protection.executeAction(sock, msg, protectionResult.type, userJid);
                    return;
                }
            }

            if (State.inProgress(chatJid, userJid)) {
                const st = State.get(chatJid, userJid);
                const cmd = commands.get(st.flow);
                if (cmd?.handleStepMessage) return cmd.handleStepMessage(sock, msg, ctx);
            }

            if (!text.startsWith(PREFIX)) return;

            const command = [...commands.values()].find(cmd => cmd.name === commandName || cmd.alias?.includes(commandName));
            if (!command) return;

            if (command.adminOnly && isGroup) {
                const metadata = groupMetadata || await sock.groupMetadata(chatJid);
                const participant = metadata.participants.find(p => jidNormalizedUser(p.id) === userJid || jidNormalizedUser(p.jid) === userJid);
                if (!participant?.admin) {
                    return await sock.sendMessage(chatJid, { text: '🚫 Solo los administradores de este grupo pueden usar este comando.' });
                }
            }

            if (REQUIRE_REG && !command.public) {
                if (!DB.getUserByPhone(userJid.split('@')[0])) {
                    return await sock.sendMessage(chatJid, { text: `🔐 Debes estar registrado para usar este comando.` });
                }
            }

            console.log(chalk.yellow(`[EJECUTANDO] ${command.name} para ${userJid}`));
            await command.execute(sock, msg, args, ctx);

        } catch (err) {
            console.error(chalk.red('❌ Error en messages.upsert:'), err);
        }
    });

    // ... (resto de manejadores de eventos sin cambios) ...
}

runBot().catch(err => console.error(chalk.red('❌ Error fatal al inicializar el bot:'), err));