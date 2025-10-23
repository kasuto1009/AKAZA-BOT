// core/debugMessenger.js
export default class DebugMessenger {
  constructor(sock) {
    this.sock = sock;
    this.logFile = './debug_messages.log';
    import('fs').then(fsModule => this.fs = fsModule);
  }

  async send(chatJid, message, options = {}) {
    try {
      await this.sock.sendMessage(chatJid, message, options);
    } catch (err) {
      const errorLog = {
        timestamp: new Date().toISOString(),
        chatJid,
        message: JSON.stringify(message),
        options: JSON.stringify(options),
        error: err.toString()
      };
      console.error('[DEBUG SEND ERROR]', errorLog);
      if (this.fs) {
        this.fs.appendFileSync(this.logFile, JSON.stringify(errorLog) + '\n');
      }
      throw err; // opcional: para que el bot siga mostrando el error
    }
  }
}
