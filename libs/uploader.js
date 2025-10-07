// libs/uploader.js (VERSIÓN COMMONJS)

const axios = require('axios');
const BodyForm = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const cheerio = require('cheerio');

// --- Funciones de subida de archivos ---

function TelegraPh(Path) {
    return new Promise(async (resolve, reject) => {
        if (!fs.existsSync(Path)) return reject(new Error("Archivo no encontrado"));
        try {
            const form = new BodyForm();
            form.append("file", fs.createReadStream(Path));
            const { data } = await axios({
                url: "https://telegra.ph/upload",
                method: "POST",
                headers: { ...form.getHeaders() },
                data: form
            });
            // La respuesta es un array, tomamos el primer elemento
            if (data && data[0] && data[0].src) {
                resolve("https://telegra.ph" + data[0].src);
            } else {
                reject(new Error("Respuesta inválida de Telegra.ph"));
            }
        } catch (err) {
            reject(new Error(String(err)));
        }
    });
}

function UploadFileUgu(input) {
    return new Promise(async (resolve, reject) => {
        const form = new BodyForm();
        form.append("files[]", fs.createReadStream(input));
        await axios({
            url: "https://uguu.se/upload.php",
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36",
                ...form.getHeaders()
            },
            data: form
        }).then((response) => {
            // Se añade una verificación para asegurar que la respuesta es la esperada
            if (response.data && response.data.files && response.data.files[0]) {
                resolve(response.data.files[0]);
            } else {
                reject(new Error('Respuesta inválida del servidor Uguu.se'));
            }
        }).catch(reject);
    });
}

function webp2mp4File(path) {
    return new Promise((resolve, reject) => {
        const form = new BodyForm();
        form.append('new-image-url', '');
        form.append('new-image', fs.createReadStream(path));
        axios({
            method: 'post',
            url: 'https://s6.ezgif.com/webp-to-mp4',
            data: form,
            headers: { 'Content-Type': `multipart/form-data; boundary=${form._boundary}` }
        }).then(({ data }) => {
            const bodyFormThen = new BodyForm();
            const $ = cheerio.load(data);
            const file = $('input[name="file"]').attr('value');
            if (!file) return reject(new Error('No se pudo encontrar el archivo procesado en Ezgif'));

            bodyFormThen.append('file', file);
            bodyFormThen.append('convert', "Convert WebP to MP4!");
            axios({
                method: 'post',
                url: 'https://ezgif.com/webp-to-mp4/' + file,
                data: bodyFormThen,
                headers: { 'Content-Type': `multipart/form-data; boundary=${bodyFormThen._boundary}` }
            }).then(({ data }) => {
                const $ = cheerio.load(data);
                const result = 'https:' + $('div#output > p.outfile > video > source').attr('src');
                resolve({
                    status: true,
                    message: "Creado por Akaza Bot",
                    result: result
                });
            }).catch(reject);
        }).catch(reject);
    });
}

async function floNime(medianya, options = {}) {
    // NOTA: 'file-type' es un paquete ESM-only, por lo que usamos import() dinámico.
    const { fromBuffer } = await import('file-type');
    
    const { ext } = await fromBuffer(medianya) || options.ext;
    var form = new BodyForm();
    form.append('file', medianya, 'tmp.' + ext);
    let jsonnya = await fetch('https://flonime.my.id/upload', {
            method: 'POST',
            body: form
        })
        .then((response) => response.json());
    return jsonnya;
}

// Exportamos todas las funciones usando module.exports
module.exports = {
    TelegraPh,
    UploadFileUgu,
    webp2mp4File,
    floNime
};