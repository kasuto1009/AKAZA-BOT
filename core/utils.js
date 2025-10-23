// core/utils.js (VERSIÓN COMMONJS - COMPLETA CON GENERACIÓN DE IDS)

const { parsePhoneNumberFromString } = require('libphonenumber-js');
const ct = require('countries-and-timezones');
const moment = require('moment-timezone');
const chalk = require('chalk'); // Añadimos chalk para logs internos

// =======================================================
// 🔥 FUNCIONES DE GENERACIÓN DE IDS (NUEVAS)
// =======================================================

/**
 * Genera un número aleatorio de 5 dígitos (para la wallet).
 * @param {number} maxDigits El máximo de dígitos (por defecto 5).
 * @returns {number} El ID numérico.
 */
function generateWalletId(maxDigits = 5) {
    // Asegura 5 dígitos: un número entre 10000 y 99999
    const min = Math.pow(10, maxDigits - 1);
    const max = Math.pow(10, maxDigits) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Genera un ID alfanumérico (ej., 3 letras + 6 números).
 * @param {number} numLetters Número de letras al inicio (ej. 3).
 * @param {number} numDigits Número de dígitos al final (ej. 6).
 * @returns {string} El ID alfanumérico.
 */
function generatePurchaseId(numLetters = 3, numDigits = 6) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';

    // Genera letras
    for (let i = 0; i < numLetters; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    // Genera números
    for (let i = 0; i < numDigits; i++) {
        result += Math.floor(Math.random() * 10);
    }
    // Aseguramos mayúsculas
    return result.toUpperCase();
}

// =======================================================
// FUNCIONES DE TELÉFONO Y TIEMPO (ORIGINALES)
// =======================================================

/**
 * Normaliza un string de teléfono a solo dígitos (sin '+').
 * @param {string} s El string a limpiar.
 * @returns {string}
 */
function onlyDigits(s) {
    return String(s || '').replace(/\D/g, '');
}

/**
 * Intenta obtener el código de país ISO (alpha-2) desde un número de teléfono.
 * @param {string} phone El número de teléfono (ej. '593987...').
 * @returns {string|null} El código del país (ej. 'EC') o null.
 */
function getCountryAlpha2FromPhone(phone) {
    const digits = onlyDigits(phone);
    if (!digits) return null;
    try {
        const parsed = parsePhoneNumberFromString('+' + digits);
        if (!parsed) return null;
        return parsed.country || null;
    } catch (e) {
        console.error(chalk.red('Error en parsePhoneNumberFromString:'), e.message);
        return null;
    }
}

/**
 * Obtiene la zona horaria (IANA) preferida para un número de teléfono.
 * @param {string} phone El número de teléfono.
 * @returns {string} La zona horaria (ej. 'America/Guayaquil') o 'UTC' como fallback.
 */
function getTimezoneForPhone(phone) {
    const alpha2 = getCountryAlpha2FromPhone(phone);
    if (alpha2) {
        const zones = ct.getTimezonesForCountry(alpha2);
        if (zones && zones.length) return zones[0].name;
    }
    return 'UTC';
}

/**
 * Obtiene la hora local formateada para un número de teléfono.
 * @param {string} phone El número de teléfono.
 * @param {string} fmt El formato de fecha y hora deseado.
 * @returns {string} La hora local formateada.
 */
function getLocalTimeForPhone(phone, fmt = 'HH:mm:ss — D MMM YYYY') {
    try {
        const tz = getTimezoneForPhone(phone) || 'UTC';
        return moment().tz(tz).format(fmt);
    } catch (e) {
        console.error(chalk.red('Error al obtener la hora local:'), e.message);
        return moment().utc().format(fmt);
    }
}

// Exportamos las funciones usando module.exports
module.exports = {
    getCountryAlpha2FromPhone,
    getTimezoneForPhone,
    getLocalTimeForPhone,
    onlyDigits,
    // 🔥 Exportación de las nuevas funciones de ID
    generateWalletId,
    generatePurchaseId
};