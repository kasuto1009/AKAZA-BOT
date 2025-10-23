// libs/uploader.js (ULTRA PREMIUM REFORZADA - CORRECCIÓN EXTENSIONES UGUU)

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const cheerio = require('cheerio');

/**
 * Detecta automáticamente el tipo de archivo (universal)
 */
async function detectFileType(buffer) {
    try {
        const imported = await import('file-type');
        const FileType = imported.default || imported;
        const result = await (FileType.fileTypeFromBuffer || FileType.fromBuffer)(buffer);
        return result || null;
    } catch (err) {
        console.warn('[DETECT FILE-TYPE] No se pudo cargar file-type:', err.message);
        return null;
    }
}

/**
 * Sube un archivo a Telegra.ph
 */
async function TelegraPh(media) {
    try {
        const form = new FormData();
        let fileBuffer;

        if (Buffer.isBuffer(media)) fileBuffer = media;
        else if (fs.existsSync(media)) fileBuffer = fs.readFileSync(media);
        else throw new Error('Archivo o buffer inválido para Telegra.ph');

        const fileInfo = await detectFileType(fileBuffer);
        if (!fileInfo) throw new Error('No se pudo determinar el tipo de archivo para Telegra.ph');

        form.append('file', fileBuffer, {
            filename: `akaza-upload.${fileInfo.ext}`,
            contentType: fileInfo.mime
        });

        const { data } = await axios.post("https://telegra.ph/upload", form, {
            headers: { ...form.getHeaders() },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (data.error) throw new Error(data.error);
        if (data && data[0] && data[0].src) return "https://telegra.ph" + data[0].src;
        throw new Error('Respuesta inválida de Telegra.ph');

    } catch (err) {
        const msg = err.response ? `Error ${err.response.status}: ${err.response.statusText}` : err.message;
        throw new Error(`Fallo en Telegra.ph: ${msg}`);
    }
}

/**
 * Sube un archivo a Uguu.se con extensión correcta
 */
async function UploadFileUgu(media, ext = 'jpg') {
    try {
        const form = new FormData();

        if (Buffer.isBuffer(media)) form.append("files[]", media, { filename: `upload.${ext}` });
        else if (fs.existsSync(media)) form.append("files[]", fs.createReadStream(media));
        else throw new Error("Archivo o buffer inválido para Uguu");

        const response = await axios.post("https://uguu.se/upload.php", form, {
            headers: { "User-Agent": "Mozilla/5.0", ...form.getHeaders() },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        if (response.data?.files?.[0]) return response.data.files[0];
        throw new Error('Respuesta inválida de Uguu.se');

    } catch (err) {
        throw new Error(`[UGUU] ${err.message}`);
    }
}

/**
 * Convierte un sticker WebP a MP4 usando Ezgif
 */
async function webp2mp4File(filePath) {
    try {
        const form1 = new FormData();
        form1.append('new-image-url', '');
        form1.append('new-image', fs.createReadStream(filePath));

        const { data: firstPage } = await axios.post('https://s6.ezgif.com/webp-to-mp4', form1, {
            headers: { 'Content-Type': `multipart/form-data; boundary=${form1._boundary}` }
        });

        const $ = cheerio.load(firstPage);
        const file = $('input[name="file"]').attr('value');
        if (!file) throw new Error('No se encontró archivo procesado (Ezgif paso 1)');

        const form2 = new FormData();
        form2.append('file', file);
        form2.append('convert', 'Convert WebP to MP4!');

        const { data: secondPage } = await axios.post('https://ezgif.com/webp-to-mp4/' + file, form2, {
            headers: { 'Content-Type': `multipart/form-data; boundary=${form2._boundary}` }
        });

        const $$ = cheerio.load(secondPage);
        const resultUrl = $$('div#output > p.outfile > video > source').attr('src');
        if (!resultUrl) throw new Error('No se encontró enlace final del video (Ezgif paso 2)');

        return { status: true, message: 'Creado por Akaza Bot', result: 'https:' + resultUrl };
    } catch (err) {
        throw new Error(`[WEBP2MP4] ${err.message}`);
    }
}

/**
 * Sube archivo a floNime.my.id
 */
async function floNime(media, options = {}) {
    try {
        const fileInfo = await detectFileType(media);
        const ext = fileInfo?.ext || options.ext;
        if (!ext) throw new Error('No se pudo determinar extensión para floNime');

        const form = new FormData();
        form.append('file', media, 'tmp.' + ext);

        const { data } = await axios.post('https://flonime.my.id/upload', form, {
            headers: { ...form.getHeaders() },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        });

        return data;
    } catch (err) {
        throw new Error(`[FLO-NIME] ${err.message}`);
    }
}

module.exports = { TelegraPh, UploadFileUgu, webp2mp4File, floNime, detectFileType };
