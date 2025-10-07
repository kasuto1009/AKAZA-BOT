// libs/youtube.js (VERSIÓN SIMPLIFICADA - SOLO AUDIO CON YT-DLP)

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;

// --- CONFIGURACIÓN INICIAL ---
const tempFolder = path.join(__dirname, "../tmp/");
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

const ytDlpWrap = new YTDlpWrap();

// --- FUNCIONES HELPER ---
function isYTUrl(url) {
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i.test(url);
}

// --- NUEVA FUNCIÓN DE DESCARGA CON METADATOS COMPLETOS ---
async function ytPlay(query) {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Buscar el video en YouTube para obtener la URL
            const searchResults = await yts(query);
            if (!searchResults.videos || searchResults.videos.length === 0) {
                throw new Error('No se encontraron resultados para la búsqueda.');
            }
            
            const videoUrl = searchResults.videos[0].url;

            // 2. Obtener TODOS los metadatos del video usando yt-dlp
            const metadata = await ytDlpWrap.getVideoInfo(videoUrl);

            // 3. Definir la ruta de salida para el archivo de audio
            const filePath = path.join(tempFolder, `${Date.now()}.mp3`);

            // 4. Usar yt-dlp para descargar y convertir a MP3
            console.log(`[YT-DLP] Iniciando descarga de: ${videoUrl}`);
            await ytDlpWrap.execPromise([
                videoUrl,
                '-x', // Extraer audio
                '--audio-format', 'mp3',
                '--audio-quality', '0', // Mejor calidad
                '-o', filePath,
                '--no-playlist'
            ]);

            if (!fs.existsSync(filePath)) {
                throw new Error('yt-dlp no pudo descargar el archivo de audio.');
            }
            console.log(`[YT-DLP] Descarga completada en: ${filePath}`);

            // 5. Devolver un objeto con toda la información detallada
            resolve({
                title: metadata.title || 'Título Desconocido',
                channel: metadata.channel || 'Canal Desconocido',
                views: metadata.view_count,
                likes: metadata.like_count,
                uploadDate: metadata.upload_date, // Formato YYYYMMDD
                duration: metadata.duration_string,
                thumb: metadata.thumbnail,
                url: videoUrl,
                filePath: filePath,
            });

        } catch (error) {
            console.error('[YT-DLP ERROR]', error);
            reject(new Error('Falló el proceso de descarga con yt-dlp.'));
        }
    });
}

// Se exportan solo las funciones necesarias para el comando 'play'
module.exports = {
    isYTUrl,
    ytPlay,
};