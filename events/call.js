// events/call.js (VERSIÓN MEJORADA)
import chalk from 'chalk';

export default async (sock, callEvent) => {
    try {
        const call = callEvent?.[0];
        if (!call) return;

        if (call.status === 'offer') {
            const from = call.from;
            console.log(chalk.red(`[LLAMADA] Llamada entrante de ${from}, bloqueando...`));

            try {
                await sock.sendMessage(from, { text: '❌ Las llamadas no están permitidas. Serás bloqueado.' });
                await sock.updateBlockStatus(from, 'block');
                console.log(chalk.green(`[LLAMADA] ${from} bloqueado correctamente.`));
            } catch (err) {
                console.error(chalk.red(`[ERROR] No se pudo bloquear a ${from}:`), err.message);
            }
        }
    } catch (error) {
        console.error(chalk.red("[ERROR] Evento de llamada:"), error.message);
    }
};
