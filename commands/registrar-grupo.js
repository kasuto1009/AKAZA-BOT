<<<<<<< HEAD
// commands/registrar-grupo.js (VERSIÓN "KATANA DEMONIACA")
=======
// commands/registrar-grupo.js (VERSIÓN COMMONJS - CORREGIDA PARA COMUNIDADES)
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

const DB = require('../core/db.js');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'registrar-grupo',
    alias: ['activar-bot', 'setup-group'],
<<<<<<< HEAD
    description: 'Forja un Pacto de Sangre para registrar y activar el bot en este clan.',
    adminOnly: true,
=======
    description: 'Registra y activa el bot para el grupo actual.',
    adminOnly: true, // El index.js ya se encarga de la verificación principal
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39

    execute: async (sock, msg, args, ctx) => {
        const { chatJid, userJid, isGroup } = ctx;

        if (!isGroup) {
<<<<<<< HEAD
            return sock.sendMessage(chatJid, { text: '👹 Esta técnica de pacto solo puede ser ejecutada en un campo de batalla (grupo).' });
=======
            return sock.sendMessage(chatJid, { text: '❌ Este comando solo se puede usar en grupos.' });
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
        }

        try {
            const metadata = await sock.groupMetadata(chatJid);
<<<<<<< HEAD
            const userParticipant = metadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(userJid) || jidNormalizedUser(p.jid) === jidNormalizedUser(userJid));

            if (!userParticipant?.admin) {
                return sock.sendMessage(chatJid, { text: '👹 Solo un Hashira puede forjar un pacto en nombre del clan.' });
            }

            DB.registerGroup(chatJid, metadata.subject);
            
            const successMessage =
`╪══════ 👹 ══════╪
    *~ Pacto de Sangre Sellado ~*

¡El pacto con el clan *${metadata.subject}* ha sido forjado!

El bot ahora reconocerá este dominio y responderá al llamado de sus guerreros.
╪══════ •| ✧ |• ══════╪`;

            await sock.sendMessage(chatJid, { text: successMessage });

        } catch (error) {
            console.error('[REGISTRAR-GRUPO ERROR]', error);
            await sock.sendMessage(chatJid, { text: '❌ Ocurrió un error al intentar forjar el pacto con el clan.' });
        }
    }
};
=======
            
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
