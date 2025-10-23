// libs/mediafire.js (VERSIÓN COMMONJS)

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrae la información de descarga de un enlace de MediaFire.
 * @param {string} url - La URL del archivo de MediaFire.
 * @returns {Promise<object>} Un objeto con el nombre, mime, tamaño y enlace de descarga.
 */
const mediafireDl = async (url) => {
    try {
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        
        const link = $('a#downloadButton').attr('href');
        if (!link) {
            throw new Error('No se pudo encontrar el enlace de descarga. El archivo puede haber sido eliminado o la URL es incorrecta.');
        }

        const size = $('a#downloadButton').text().replace('Download', '').replace('(', '').replace(')', '').trim();
        const seplit = link.split('/');
        const nama = seplit[5];
        const mime = nama.split('.').pop(); // Método más seguro para obtener la extensión

        // Devolvemos un objeto directamente
        return { nama, mime, size, link };
    } catch (error) {
        console.error("[MEDIAFIRE DOWNLOADER ERROR]", error);
        // Lanzamos un error para que el comando que llama a esta función pueda manejarlo
        throw new Error('No se pudo procesar el enlace de MediaFire.');
    }
};

// Exportamos la función usando module.exports
module.exports = {
    mediafireDl
};