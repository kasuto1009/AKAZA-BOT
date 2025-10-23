<<<<<<< HEAD
// =================================================================
// BOT DE WHATSAPP AVANZADO - index.js (VERSIÓN FINAL Y COMPLETA, CORREGIDA DE SINTAXIS Y ERRORES DE LÓGICA)
// =================================================================

require('dotenv').config();

// =================================================================
// 🔇 SOLUCIÓN FORZADA ANTI-RUIDO DE SESIÓN (FINAL Y COMPLETA)
// =================================================================
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

const keywordsToIgnore = [
    'Closing stale open session',
    'Closing session: SessionEntry',
    'prekey bundle',
    'Closing open session in favor of incoming',
    'SessionEntry',
    'Session error:Error: Bad MAC',
    'Failed to decrypt message with any known session'
];

// Filtro para console.log
console.log = function() {
    const logMessage = Array.from(arguments).join(' ');
    if (!keywordsToIgnore.some(keyword => logMessage.includes(keyword))) {
        originalConsoleLog.apply(console, arguments);
    }
};

// Filtro para console.error
console.error = function() {
    const errorMessage = Array.from(arguments).join(' ');
    if (!keywordsToIgnore.some(keyword => errorMessage.includes(keyword))) {
        originalConsoleError.apply(console, arguments);
    }
};

// Filtro para console.warn
console.warn = function() {
    const warnMessage = Array.from(arguments).join(' ');
    if (!keywordsToIgnore.some(keyword => warnMessage.includes(keyword))) {
        originalConsoleWarn.apply(console, arguments);
    }
};

// Filtro para console.info
console.info = function() {
    const infoMessage = Array.from(arguments).join(' ');
    if (!keywordsToIgnore.some(keyword => infoMessage.includes(keyword))) {
        originalConsoleInfo.apply(console, arguments);
    }
};
// =================================================================


const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const P = require('pino');
const { Boom } = require('@hapi/boom');
const cfonts = require('cfonts');
const qrcode = require('qrcode-terminal');
const readline = require('readline');
const NodeCache = require('node-cache'); // Asegúrate de que esté instalado

// --- Dependencias de Baileys ---
const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
    useMultiFileAuthState,
    jidNormalizedUser,
} = require('@whiskeysockets/baileys');

// --- CACHÉ PARA METADATOS DE CONTACTOS ---
const contactsCache = new NodeCache({ stdTTL: 86400, useClones: false });

// --- Importaciones de Módulos del Proyecto ---
const State = require('./core/state');
const DB = require('./core/db');
const Protection = require('./libs/protection');
const Utils = require('./core/utils');

// --- ARRANQUE VISUAL ---
const { say } = cfonts;
say('Akaza Bot', { font: 'block', align: 'center', gradient: ['red', 'magenta'] });
say('Creado por Kazuto', { font: 'console', align: 'center', gradient: ['cyan', 'blue'] });

// --- Variables de Entorno y Constantes ---
const AUTH_FILE_PATH = './auth_info_baileys';
const PREFIX = process.env.PREFIX || '!';
const REQUIRE_REG = (process.env.REQUIRE_REGISTRATION || 'true').toLowerCase() === 'true';

// 🚨 NORMALIZAMOS EL OWNER_NUMBER AL INICIO
const OWNER_NUMBER_CLEAN = process.env.OWNER_NUMBER ? String(process.env.OWNER_NUMBER).replace(/[^0-9]/g, '') : '';

if (!OWNER_NUMBER_CLEAN) {
    console.error(chalk.red('❌ ERROR: La variable OWNER_NUMBER no está definida o está vacía en el archivo .env.'));
    process.exit(1);
}

// --- STORE EN MEMORIA INTEGRADO ---
const makeInMemoryStore = () => {
    const store = {
        messages: {},
        bind(ev) { ev.on('messages.upsert', ({ messages }) => { for (const msg of messages) { const jid = msg.key.remoteJid; if (!this.messages[jid]) this.messages[jid] = {}; this.messages[jid][msg.key.id] = msg; } }); },
        loadMessage(jid, id) { return this.messages[jid]?.[id]; }
    };
    store.readFromFile = () => { /* Logic here if file-based */ };
    store.writeToFile = () => { /* Logic here if file-based */ };

    return store;
};
const store = makeInMemoryStore();


// --- Helper para obtener el JID del remitente ---
function getInitialUserJid(msg) {
    return jidNormalizedUser(msg.key.participant || msg.participant || msg.key.remoteJid);
}

// --- Función para obtener el nombre del contacto o ID (Mejorada para Log) ---
async function getContactName(sock, jid, msg) {
    if (msg.pushName) return msg.pushName;

    const cachedContact = contactsCache.get(jid);
    if (cachedContact) return cachedContact.name || cachedContact.verifiedName || cachedContact.notify || jid.split('@')[0];

    const rawNumber = jid.split('@')[0];
    const isInternalId = rawNumber.length > 15 || !/^\d+$/.test(rawNumber);

    if (isInternalId) {
        try {
            const contact = await sock.fetchStatus(jid);
            if (contact && contact.name) {
                contactsCache.set(jid, contact);
                return contact.name;
            }
        } catch (e) {
            return rawNumber;
        }
    }

    return rawNumber;
}

// --- Función para la Solicitud de Código de Emparejamiento ---
async function requestPairingCode(sock, phoneNumber) {
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    const code = await sock.requestPairingCode(cleanNumber);

    console.log(chalk.yellow('\n======================================================'));
    console.log(chalk.yellow(`>>> 🔢 CÓDIGO DE EMPAREJAMIENTO GENERADO: ${code} <<<`));
    console.log(chalk.yellow('>>> 📱 Abre WhatsApp en tu teléfono, ve a Dispositivos Vinculados > Vincular un dispositivo y usa el código.'));
    console.log(chalk.yellow('======================================================\n'));
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

// --- Caché de Administradores ---
const groupAdminsCache = new Map();


// --- Función Principal del Bot ---
async function runBot() {
    let sock;
    let loginMethod = 1; // Default a QR Code
    let phoneNumberRaw = '';

    const isSessionExists = fs.existsSync(AUTH_FILE_PATH);

    // 1. Cargar el estado de autenticación o forzar la elección de login.
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FILE_PATH);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    if (!isSessionExists) {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        console.log(chalk.cyan('\n======================================================'));
        console.log(chalk.cyan('>>> 💡 SESIÓN NUEVA REQUERIDA. ELIJA MÉTODO DE LOGIN: <<<'));
        console.log(chalk.cyan('>>> [1] QR Code (Escanear desde la terminal)'));
        console.log(chalk.cyan('>>> [2] Ingresar código de 8 dígitos\n'));
        console.log(chalk.cyan('======================================================\n'));
        const choice = await new Promise(resolve => { rl.question(chalk.yellow('Ingrese [1] o [2]: '), resolve); });
        loginMethod = parseInt(choice.trim());
        if (loginMethod === 2) {
            phoneNumberRaw = await new Promise(resolve => { rl.question(chalk.yellow('Ingrese su número de teléfono con código de país (Ej: 51999999999): '), resolve); });
        }
        rl.close();
    }

    console.log(chalk.yellow(`Usando Baileys v${version.join('.')}, ¿es la última?: ${isLatest}`));

    sock = makeWASocket({
        logger: P({ level: 'silent' }),
        auth: state,
        version,
        browser: ['Akaza_bot', 'Safari', '1.0.0'],
        getMessage: async (key) => store.loadMessage(key.remoteJid, key.id)
    });
    store.bind(sock.ev);

    // 2. Manejo de Pairing Code
    if (!isSessionExists && loginMethod === 2) {
        sock.ev.once('connection.update', async (update) => {
            if (update.connection === 'connecting' || !!update.qr) {
                await requestPairingCode(sock, phoneNumberRaw);
            }
        });
    }

    // 3. MANEJADORES DE EVENTOS
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('contacts.upsert', updates => { updates.forEach(update => contactsCache.set(update.id, update)); });
    sock.ev.on('contacts.update', updates => { updates.forEach(update => { const contact = contactsCache.get(update.id); if (contact) { Object.assign(contact, update); contactsCache.set(update.id, contact); } }); });

    // 4. Lógica de Reconexión y Carga Inicial de Admins
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && loginMethod !== 2) { qrcode.generate(qr, { small: true }); }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = (lastDisconnect?.error instanceof Boom) && statusCode !== DisconnectReason.loggedOut;

            if (statusCode === DisconnectReason.loggedOut || statusCode === DisconnectReason.badSession) {
                console.log(chalk.red('\n🚨 ERROR CRÍTICO: SESIÓN PERDIDA. Limpiando archivos...'));
                if (fs.existsSync(AUTH_FILE_PATH)) { fs.rmSync(AUTH_FILE_PATH, { recursive: true, force: true }); }
                return process.exit(1);
            }

            if (shouldReconnect) {
                console.log(chalk.yellow(`[BAILEYS] Conexión cerrada. Reintentando en 5s...`));
                setTimeout(runBot, 5000);
            }

        } else if (connection === 'open') {
            console.log(chalk.green('✅ ¡Conexión exitosa!'));

            // CARGA INICIAL DE ADMINISTRADORES DE GRUPO
            console.log(chalk.blue('Cargando información de administradores de grupos...'));
            try {
                const groups = await sock.groupFetchAllParticipating();
                for (const groupId in groups) {
                    const group = groups[groupId];
                    const admins = group.participants.filter(p => p.admin).map(p => p.id);
                    groupAdminsCache.set(groupId, new Set(admins.map(jidNormalizedUser)));
                }
                console.log(chalk.blue(`📦 Información de ${groupAdminsCache.size} grupos cargada en caché.`));
            } catch (e) {
                console.error(chalk.red('Error al cargar la información de los grupos:'), e);
            }
        }
    });

    // Guardar el store al cerrar el bot (para persistencia de mensajes)
    const storeInterval = setInterval(() => {
        store.writeToFile();
    }, 10000); // Guarda cada 10 segundos


    // 5. LÓGICA PRINCIPAL DE MENSAJES
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        try {
            // 🚨 Verificación crítica de JID y remota
            if (!msg || !msg.message || msg.key.fromMe || !msg.key.remoteJid || msg.key.remoteJid === 'status@broadcast') return;

            const chatJid = msg.key.remoteJid;
            const isGroup = chatJid.endsWith('@g.us');
            let userJid = getInitialUserJid(msg); // Puede ser JID o LID

            // 🚨 DEFINICIÓN DE VARIABLES DE MENSAJE Y COMANDO (TEMPRANA)
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || '';
            const args = text.slice(PREFIX.length).trim().split(/\s+/);
            const commandName = (args.shift() || '').toLowerCase();


            // =================================================================
            // 🔥 SOLUCIÓN LID: FORZAR RESOLUCIÓN DE userJid
            // =================================================================
            let groupMetadata;
            if (isGroup && userJid.endsWith('@lid')) {
                try {
                    groupMetadata = await sock.groupMetadata(chatJid);
                    const participant = groupMetadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid));
                    if (participant && participant.jid) {
                        userJid = jidNormalizedUser(participant.jid); // JID real
                    } else {
                        return; // Detenemos la ejecución si no podemos identificar al usuario
                    }
                } catch (metaError) {
                    return;
                }
            }

            // 🚨 LIMPIEZA FINAL: rawPhoneNumber debe ser la llave limpia para la DB
            let rawPhoneNumber = userJid.split('@')[0];
            rawPhoneNumber = rawPhoneNumber.replace(/[^0-9]/g, ''); // 🚨 LIMPIEZA CRÍTICA

            // 🚨 FORZAR OWNER: Si el número limpio coincide, lo tratamos como Owner
            if (rawPhoneNumber === OWNER_NUMBER_CLEAN) {
                rawPhoneNumber = OWNER_NUMBER_CLEAN;
            }

            // --- LOGGING CORREGIDO ---
            const senderIdForLog = await getContactName(sock, userJid, msg);

            // --- MIGRACIÓN/REGISTRO (Ahora solo genera IDs si es necesario) ---
            let user = DB.getUserByPhone(rawPhoneNumber);

            // 🚨 CONSTRUIMOS EL CTX ANTES DEL FLUJO DE ESTADO
            const ctx = { prefix: PREFIX, chatJid, userJid, rawPhoneNumber, isGroup, user: user, commands: commands, args: args, commandName: commandName, store: store };


            // 🚨 Manejador de registro/migración si el usuario no existe (se ejecuta primero)
            if (!user) {
                // ESTE BLOQUE AHORA ESTÁ COMENTADO PARA EVITAR EL REGISTRO AUTOMÁTICO
                /*
                // Generar IDs para el nuevo usuario
                let newWalletId;
                let newPurchaseId;
                do { newWalletId = Utils.generateWalletId(); } while (DB.getUserByWalletId(newWalletId));
                do { newPurchaseId = Utils.generatePurchaseId(); } while (DB.getUserByPurchaseId(newPurchaseId));

                const newUser = {
                    user_phone: rawPhoneNumber,
                    wallet_id: newWalletId,
                    purchase_id: newPurchaseId,
                    rol_user: 'Aspirante',
                    alias: msg.pushName || rawPhoneNumber,
                    name: msg.pushName || rawPhoneNumber,
                };
                DB.insertOrUpdateUser(newUser);
                console.log(chalk.green(`[REGISTRO INICIAL] Usuario ${rawPhoneNumber} registrado con IDs.`));
                user = DB.getUserByPhone(rawPhoneNumber); // Recargamos el objeto
                ctx.user = user; // Actualizamos el user en el contexto
                */
            }
            // --- FIN REGISTRO/MIGRACIÓN ---


            // Incrementar contador de mensajes solo si el usuario ya existe (o acaba de ser creado)
            if (user) { // Solo incrementamos si el usuario existe (ya no se auto-registra)
                DB.incrementMessageCount(rawPhoneNumber);
            }


            // Log de mensaje entrante (Usa senderIdForLog)
            const senderType = isGroup ? chalk.green('[GRUPO]') : chalk.blue('[PRIVADO]');
            if (text.length > 0) {
                console.log(`${senderType} ${chalk.yellow(senderIdForLog)}: ${chalk.white(text)}`);
            }

            // =================================================================
            // 🔥 MANEJO CRÍTICO DEL ESTADO: PROCESAR RESPUESTAS DE FLUJO PRIMERO
            // =================================================================
            if (State.inProgress(chatJid, userJid)) {
                const st = State.get(chatJid, userJid);
                const cmd = commands.get(st.flow);
                // Si hay un flujo activo y el comando tiene un manejador de pasos:
                if (cmd?.handleStepMessage) {
                    // console.log(chalk.yellow(`[FLOW] Procesando paso ${st.step} para flujo: ${st.flow}`)); // SILENCIADO
                    return cmd.handleStepMessage(sock, msg, ctx); // 👈 ¡Retorna aquí!
                }
            }

            // =================================================================
            // ✅ LÓGICA DE PROTECCIÓN (MOVIDA AQUÍ para ejecutarse en TODOS los mensajes)
            // =================================================================
            if (isGroup) {
                const protectionResult = await Protection.checkProtections(sock, msg, groupAdminsCache);
                if (protectionResult.violation) {
                    await Protection.executeAction(sock, msg, protectionResult.type, userJid);
                    return; // Detiene la ejecución si hay una violación (antilink, antitoxic)
                }
            }
            // =================================================================
            
            // Si el mensaje no tiene el prefijo, lo ignoramos AHORA
            // (Esto se ejecuta DESPUÉS de las protecciones)
            if (!text.startsWith(PREFIX)) return;
            // =================================================================


            // --- CHEQUEO DE COMANDOS ---
            const command = commands.get(commandName) || [...commands.values()].find(cmd => cmd.alias && cmd.alias.includes(commandName));
            if (!command) return;

            const isOwner = rawPhoneNumber === OWNER_NUMBER_CLEAN;

            if (REQUIRE_REG && !command.public) {
                if (!isOwner) { // Owner siempre pasa
                    if (!user) {
                        return await sock.sendMessage(chatJid, { text: `🔐 Debes estar registrado para usar este comando.` });
                    }
                }
            }
            // ------------------------------------------

            // MEJORA: Verificación de activación del bot en el grupo
            // (Esta verificación ya asume que el mensaje tiene prefijo, está bien aquí)
            if (isGroup) { // No es necesario '&& text.startsWith(PREFIX)' porque ya lo validamos
                const allowedCommands = ['registrar-grupo', 'activar-bot', 'setup-group'];
                if (!allowedCommands.includes(commandName)) {
                    if (!DB.isGroupActive(chatJid)) {
                        return await sock.sendMessage(chatJid, { text: '❌ Este bot ha sido desactivado para este grupo por el propietario.' });
                    }
                }
            }

            // 📣 LOG DE EJECUCIÓN CORREGIDO (Usa senderIdForLog)
            console.log(chalk.yellow(`[EJECUTANDO] ${command.name} para ${senderIdForLog}`));
            await command.execute(sock, msg, args, ctx);

        } catch (err) {
            console.error(chalk.red('❌ Error en messages.upsert:'), err);
        }
    });

    sock.ev.on('group-participants.update', async (event) => {
        const { id, participants, action } = event;
        if (action === 'promote' || action === 'demote') {
            // Actualizar caché de admins si es necesario
            try {
                const groupMeta = await sock.groupMetadata(id);
                const admins = groupMeta.participants.filter(p => p.admin).map(p => p.id);
                groupAdminsCache.set(id, new Set(admins.map(jidNormalizedUser)));
            } catch (err) {
                 console.error(chalk.red(`❌ Error actualizando admins para grupo ${id}:`), err);
            }
        }
        try {
            const chatSettings = DB.getChatSettings(id);
            if (!chatSettings?.welcome) return;
            const metadata = await sock.groupMetadata(id);
            for (const participant of participants) {
                const userMention = `@${participant.split('@')[0]}`;
                const groupName = metadata.subject;
                if (action === 'add') {
                    await sock.sendMessage(id, { text: `👋 ¡Bienvenido/a ${userMention} al grupo *${groupName}*!`, mentions: [participant] });
                } else if (action === 'remove') {
                    await sock.sendMessage(id, { text: `👋 Adiós ${userMention}, te extrañaremos.`, mentions: [participant] });
                }
            }
        } catch (err) {
             console.error(chalk.red('❌ Error en group-participants.update (welcome/goodbye):'), err);
        }
    });

    sock.ev.on('call', async (call) => {
        try {
            const botJid = jidNormalizedUser(sock.user.id);
            const botSettings = DB.getBotSettings(botJid);
            if (!botSettings?.anticall) return;
            for (const c of call) {
                if (c.status === 'offer') {
                    // ✅ CORRECCIÓN: Intentamos obtener el JID de usuario (@s.whatsapp.net) para el bloqueo
                    const callerJid = c.from.includes('@lid') 
                      ? `${c.from.split('@')[0]}@s.whatsapp.net` // Forzar el JID de usuario
                      : c.from; 

                    await sock.sendMessage(c.from, { text: `🚫 Las llamadas no están permitidas y serás bloqueado.` });
                    
                    // Usamos el JID corregido para el bloqueo
                    await sock.updateBlockStatus(callerJid, 'block'); 
                    
                    console.log(chalk.red(`[ANTICALL] Usuario ${callerJid} bloqueado por llamar.`));
                }
            }
        } catch (err) {
            console.error(chalk.red('❌ Error en el evento call:'), err);
        }
    });

    // --- MANEJO DE APAGADO ELEGANTE ---
    async function gracefulShutdown(signal) {
        console.log(chalk.yellow(`[BOT] ¡${signal} recibida! Cerrando sesión limpiamente...`));
        try {
            // Guardar store si es necesario
            store.writeToFile();
            clearInterval(storeInterval); // Detener guardado automático

            // Desconectar limpiamente si sock existe
            if(sock) {
                //await sock.logout(); // Descomentar si usas logout
                await sock.end(undefined); // Usar end para cerrar la conexión
                console.log(chalk.green('[BOT] Conexión cerrada.'));
            }
            process.exit(0); // Cierra el proceso
        } catch (err) {
            console.error(chalk.red('[BOT] Error durante el apagado elegante:'), err);
            process.exit(1); // Cierra con error
        }
    }

    process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Ctrl+C
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Señal "Stop" de Pterodactyl
    // --- FIN MANEJO DE APAGADO ELEGANTE ---

} // Fin de runBot()

runBot().catch(err => {
    console.error(chalk.red('❌ Error fatal al inicializar el bot:'), err);
    process.exit(1);
});
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
