// commands/registrar-grupo.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'registrar-grupo',
    alias: ['activar-bot', 'setup-group'],
    description: 'Registra y activa el bot para el grupo actual.',
    adminOnly: true, // El index.js ya se encarga de la verificación principal

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
            return sock.sendMessage(chatJid, { text: '❌ Este comando solo se puede usar en grupos.' });
        }

        try {
            const metadata = await sock.groupMetadata(chatJid);
            
            // =================================================================
            // CORRECCIÓN: Se mantiene una verificación robusta por si se usa fuera del flujo del index.
            // Aunque index.js ya lo verifica, esta es una capa extra de seguridad.
            // =================================================================
            const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));
            if (!userParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '🚫 Solo los administradores de este grupo pueden usar este comando.' });
            }

            // La función de la DB ahora registra y activa el grupo por defecto.
            DB.registerGroup(chatJid, metadata.subject); 
            
            await sock.sendMessage(chatJid, { text: `✅ ¡Grupo registrado y activado! El bot ahora responderá a los comandos en *${metadata.subject}*.` });

        } catch (error) {
            console.error('[REGISTRAR-GRUPO ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al registrar el grupo.' });
        }
    }
};
