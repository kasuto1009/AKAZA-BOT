// commands/status.js (VERSIÓN "KATANA DEMONIACA")

const os = require('os');
const v8 = require('v8');
const checkDiskSpace = require('check-disk-space').default;
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const OWNER_NUMBER = process.env.OWNER_NUMBER;

// --- Funciones Helper para formatear datos ---
function formatUptime(seconds) {
    function pad(s) { return (s < 10 ? '0' : '') + s; }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = Math.floor(seconds % 60);
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    name: 'status',
    alias: ['estado', 'botstatus', 'ping'],
    description: 'Ejecuta una técnica de diagnóstico para revelar el estado interno del bot.',
    public: true,

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid } = ctx;

        if (jidNormalizedUser(userJid) !== jidNormalizedUser(OWNER_NUMBER)) {
            return sock.sendMessage(chatJid, { text: '👹 Solo el Maestro del Bot puede ejecutar esta técnica de diagnóstico.' });
        }

        try {
            const uptime = formatUptime(process.uptime());
            const platform = os.platform();
            const arch = os.arch();
            
            const totalMem = formatBytes(os.totalmem());
            const freeMem = formatBytes(os.freemem());
            const usedMem = formatBytes(os.totalmem() - os.freemem());
            
            const memoryUsage = process.memoryUsage();
            const rss = formatBytes(memoryUsage.rss);
            const heapTotal = formatBytes(memoryUsage.heapTotal);
            const heapUsed = formatBytes(memoryUsage.heapUsed);
            
            const v8HeapSpace = v8.getHeapStatistics();
            const totalHeapSize = formatBytes(v8HeapSpace.total_heap_size);
            const usedHeapSize = formatBytes(v8HeapSpace.used_heap_size);
            const heapSizeLimit = formatBytes(v8HeapSpace.heap_size_limit);

            const diskSpace = await checkDiskSpace('/');
            const diskSize = formatBytes(diskSpace.size);
            const diskUsed = formatBytes(diskSpace.size - diskSpace.free);
            const diskFree = formatBytes(diskSpace.free);
            const diskUsedPercent = Math.round(((diskSpace.size - diskSpace.free) / diskSpace.size) * 100);

            // --- PERGAMINO DE DIAGNÓSTICO ESTILO "KATANA DEMONIACA" ---
            const statusMessage =
`╪══════ 👹 ══════╪
    *~ Diagnóstico de Sangre ~*

┫ 💻 *Territorio:* \`${platform} (${arch})\`
┫ ⏱️ *Resistencia:* \`${uptime}\`
╪══════ •| ✧ |• ══════╪
    *~ Flujo de Energía (RAM) ~*

┫ 🔥 *Energía Total:* \`${totalMem}\`
┫ 🍃 *Energía Libre:* \`${freeMem}\`
┫ ⚡ *Energía en Uso:* \`${usedMem}\`
╪══════ •| ✧ |• ══════╪
    *~ Concentración del Bot ~*

┫ ✨ *Presencia (RSS):* \`${rss}\`
┫ 📈 *Reserva Total (Heap):* \`${heapTotal}\`
┫ 📉 *Reserva en Uso (Heap):* \`${heapUsed}\`
┫ ⚙️ *Límite de Reserva:* \`${heapSizeLimit}\`
╪══════ •| ✧ |• ══════╪
    *~ Dominio Físico (Disco) ~*

┫ 💽 *Tamaño Total:* \`${diskSize}\`
┫ 💾 *Espacio Ocupado:* \`${diskUsed} (${diskUsedPercent}%)\`
┫ ✅ *Espacio Disponible:* \`${diskFree}\`
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: statusMessage });

        } catch (error) {
            console.error('[STATUS COMMAND ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al ejecutar la técnica de diagnóstico.' });
        }
    }
};
