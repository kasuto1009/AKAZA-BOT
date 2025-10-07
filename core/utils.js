// core/utils.js (VERSIÓN COMMONJS)

const { parsePhoneNumberFromString } = require('libphonenumber-js');
const ct = require('countries-and-timezones');
const moment = require('moment-timezone');

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
        return moment().utc().format(fmt);
    }
}

// Exportamos las funciones usando module.exports
module.exports = {
    getCountryAlpha2FromPhone,
    getTimezoneForPhone,
    getLocalTimeForPhone,
    onlyDigits
};