// libs/tiktok.js (VERSIÓN COMMONJS)

const axios = require('axios');
const cheerio = require('cheerio');

// Función helper interna para limpiar etiquetas HTML
const clean = (data) => {
    if (!data) return '';
    let regex = /(<([^>]+)>)/gi;
    data = data.replace(/(<br?\s?\/>)/gi, " \n");
    return data.replace(regex, "");
};

// Función helper interna (acortador no es necesario)
async function shortener(url) {
    return url;
}

/**
 * Descarga un video de TikTok sin marca de agua.
 * @param {string} query - La URL del video de TikTok.
 * @returns {Promise<object>}
 */
const Tiktok = async (query) => {
    const response = await axios("https://lovetik.com/api/ajax/search", {
        method: "POST",
        data: new URLSearchParams(Object.entries({ query })),
    });

    if (response.data.mess) {
        throw new Error('No se pudo encontrar el video o la URL es inválida.');
    }

    const result = {};
    result.creator = "YNTKTS";
    result.title = clean(response.data.desc);
    result.author = clean(response.data.author);
    result.nowm = await shortener(
        (response.data.links[0].a || "").replace("https", "http")
    );
    result.watermark = await shortener(
        (response.data.links[1].a || "").replace("https", "http")
    );
    result.audio = await shortener(
        (response.data.links[2].a || "").replace("https", "http")
    );
    result.thumbnail = await shortener(response.data.cover);
    return result;
};

/**
 * Descarga las imágenes de un slideshow de TikTok.
 * @param {string} link - La URL del slideshow de TikTok.
 * @returns {Promise<object>}
 */
const ttimg = async (link) => {
    try {
        const url = `https://dlpanda.com/es?url=${link}&token=G7eRpMaa`;
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        const imgSrc = [];
        
        $('div.col-md-12 > img').each((index, element) => {
            imgSrc.push($(element).attr('src'));
        });

        if (imgSrc.length === 0) {
            throw new Error('No se encontraron imágenes en el enlace proporcionado.');
        }
        return { data: imgSrc };
    } catch (error) {
        console.error(error);
        throw new Error('No se obtuvo respuesta de la página, intente más tarde.');
    }
};

module.exports = { Tiktok, ttimg };

