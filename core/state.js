<<<<<<< HEAD
// core/state.js (VERSIÓN COMMONJS)

const sessions = new Map();
// La estructura de la clave es: `${chatJid}:${userJid}` => { flow, step, data }

/**
 * Genera la clave única para cada usuario en cada chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {string}
 */
function key(chatJid, userJid) {
    return `${chatJid}:${userJid}`;
}

/**
 * Inicia un flujo de estado para un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @param {string} flow Nombre del flujo (ej: 'registrar').
 * @param {object} initialData Datos iniciales para el flujo.
 */
function start(chatJid, userJid, flow = 'default', initialData = {}) {
    sessions.set(key(chatJid, userJid), { flow, step: 0, data: initialData });
}

/**
 * Obtiene el estado actual de un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {object|undefined}
 */
function get(chatJid, userJid) {
    return sessions.get(key(chatJid, userJid));
}

/**
 * Actualiza el estado de un usuario en un chat, asegurando mantener la estructura.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @param {object} state 
 */
function set(chatJid, userJid, state) {
    if (!state || typeof state !== 'object') return;
    const existing = get(chatJid, userJid) || {};
    const updated = {
        flow: state.flow || existing.flow || 'default',
        step: typeof state.step === 'number' ? state.step : (existing.step || 0),
        data: state.data || existing.data || {}
    };
    sessions.set(key(chatJid, userJid), updated);
}

/**
 * Limpia/elimina el estado de un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 */
function clear(chatJid, userJid) {
    sessions.delete(key(chatJid, userJid));
}

/**
 * Verifica si un usuario tiene un flujo de estado activo.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {boolean}
 */
function inProgress(chatJid, userJid) {
    return sessions.has(key(chatJid, userJid));
}

// Exportamos las funciones usando module.exports
module.exports = { 
    start, 
    get, 
    set, 
    clear, 
    inProgress 
=======
// core/state.js (VERSIÓN COMMONJS)

const sessions = new Map();
// La estructura de la clave es: `${chatJid}:${userJid}` => { flow, step, data }

/**
 * Genera la clave única para cada usuario en cada chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {string}
 */
function key(chatJid, userJid) {
    return `${chatJid}:${userJid}`;
}

/**
 * Inicia un flujo de estado para un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @param {string} flow Nombre del flujo (ej: 'registrar').
 * @param {object} initialData Datos iniciales para el flujo.
 */
function start(chatJid, userJid, flow = 'default', initialData = {}) {
    sessions.set(key(chatJid, userJid), { flow, step: 0, data: initialData });
}

/**
 * Obtiene el estado actual de un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {object|undefined}
 */
function get(chatJid, userJid) {
    return sessions.get(key(chatJid, userJid));
}

/**
 * Actualiza el estado de un usuario en un chat, asegurando mantener la estructura.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @param {object} state 
 */
function set(chatJid, userJid, state) {
    if (!state || typeof state !== 'object') return;
    const existing = get(chatJid, userJid) || {};
    const updated = {
        flow: state.flow || existing.flow || 'default',
        step: typeof state.step === 'number' ? state.step : (existing.step || 0),
        data: state.data || existing.data || {}
    };
    sessions.set(key(chatJid, userJid), updated);
}

/**
 * Limpia/elimina el estado de un usuario en un chat.
 * @param {string} chatJid 
 * @param {string} userJid 
 */
function clear(chatJid, userJid) {
    sessions.delete(key(chatJid, userJid));
}

/**
 * Verifica si un usuario tiene un flujo de estado activo.
 * @param {string} chatJid 
 * @param {string} userJid 
 * @returns {boolean}
 */
function inProgress(chatJid, userJid) {
    return sessions.has(key(chatJid, userJid));
}

// Exportamos las funciones usando module.exports
module.exports = { 
    start, 
    get, 
    set, 
    clear, 
    inProgress 
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};