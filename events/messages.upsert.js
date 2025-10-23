/ events/messages.upsert.js (VERSIÓN COMMONJS - OPTIMIZADA)

const chalk = require("chalk");

module.exports = async function handler(sock, m, dependencies) {
    const { commands, DB, State, PREFIX, OWNER_NUMBER } = dependencies;

    try {
        const msg = m.messages?.[0];
        if (!msg || !msg.message) return;

        // --- Filtros de seguridad ---
        if (msg.key.fromMe || msg.key.remoteJid === "status@broadcast") return;

        // --- Construcción del objeto M (simplificado para claridad) ---
        const M = {};
        M.chat = msg.key.remoteJid || "";
        M.isGroup = M.chat.endsWith("@g.us");
        M.sender = M.isGroup ? (msg.key.participant || msg.participant) : M.chat;
        M.pushName = msg.pushName || M.sender.split("@")[0];
        M.message = msg.message;
        M.key = msg.key;

        // Texto o caption
        M.text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            msg.message?.documentMessage?.caption ||
            msg.message?.buttonsResponseMessage?.selectedButtonId ||
            msg.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            "";

        // Mensaje citado
        M.quoted =
            msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;

        // Ignorar si no hay texto ni media relevante
        if (!M.text && !M.message?.imageMessage && !M.message?.videoMessage && !M.message?.documentMessage) {
            return;
        }

        // --- Logging mejorado ---
        const logPrefix = M.isGroup
            ? chalk.green("[GRUPO]")
            : chalk.blue("[PRIVADO]");
        const logText = M.text || `[${Object.keys(M.message)[0]}]`;
        console.log(
            `${logPrefix} ${chalk.yellow(M.pushName)}: ${chalk.white(logText)}`
        );

        // --- Contexto para comandos ---
        const ctx = {
            prefix: PREFIX,
            chatJid: M.chat,
            userJid: M.sender,
            isGroup: M.isGroup,
            pushName: M.pushName,
            owner: OWNER_NUMBER,
            DB,
        };

        // --- Flujos de conversación (State) ---
        if (State.inProgress(M.chat, M.sender)) {
            const st = State.get(M.chat, M.sender);
            const command = commands.get(st.flow);
            if (command?.handleStepMessage) {
                try {
                    return await command.handleStepMessage(sock, M, ctx);
                } catch (err) {
                    console.error(
                        chalk.red("[ERROR en handleStepMessage]"),
                        err.message
                    );
                }
            }
        }

        // --- Verificación de prefijo ---
        if (!M.text || !M.text.startsWith(PREFIX)) return;

        const args = M.text.slice(PREFIX.length).trim().split(/\s+/);
        const commandName = args.shift().toLowerCase();

        const command =
            commands.get(commandName) ||
            [...commands.values()].find((cmd) =>
                cmd.alias?.includes(commandName)
            );

        if (!command) {
            console.log(
                chalk.red("[COMANDO NO ENCONTRADO]"),
                `"${commandName}" para ${M.sender}`
            );
            return;
        }

        // --- Ejecución del comando con control de errores ---
        console.log(
            chalk.yellow("[EJECUTANDO]"),
            `${command.name} para ${M.sender}`
        );

        try {
            await command.execute(sock, M, args, ctx);
        } catch (err) {
            console.error(
                chalk.red(`[ERROR EN COMANDO ${command.name}]`),
                err
            );
            // Opcional: Enviar mensaje de error al chat
            // await sock.sendMessage(M.chat, { text: '? Ocurrió un error al ejecutar el comando.' });
        }
    } catch (error) {
        console.error(chalk.red("?? Error grave en messages.upsert:"), error);
    }
};