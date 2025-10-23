<<<<<<< HEAD
// libs/youtube.js (VERSIÓN FINAL Y CONSISTENTE - SIN LÍMITE DE DURACIÓN)

const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap').default;
const chalk = require('chalk');
const axios = require('axios');
const { execSync } = require('child_process');

// --- CONFIGURACIÓN INICIAL ---
const tempFolder = path.join(__dirname, "../tmp/");
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

// [CORRECCIÓN PTERODACTYL]: Especifica la ruta local del binario yt-dlp instalado en el directorio /home/container
const YT_DLP_BIN_PATH = '/home/container/yt-dlp'; 
const ytDlpWrap = new YTDlpWrap(YT_DLP_BIN_PATH); // <-- Le pasamos la ruta para que lo encuentre

const cookiesPath = path.join(__dirname, '..', 'cookies.txt');
const BROWSER_SIMULATION_OPTIONS = [
    '--no-check-certificates',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    '--add-header', 'Accept-Language: es-ES,es;q=0.9,en;q=0.8',
    '--referer', 'https://www.youtube.com/',
];

// --- FUNCIONES HELPER ---
function isFFmpegInstalled() {
    try {
        execSync('ffmpeg -version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}
const ffmpegInstalled = isFFmpegInstalled();
if (!ffmpegInstalled) console.error(chalk.red('[FFMPEG CHECK] FFmpeg no se encuentra. La descarga de videos MP4 fallará.'));

function isYTUrl(url) { return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/i.test(url); }

async function getDetailedVideoData(query) {
    const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
    if (!YOUTUBE_API_KEY) throw new Error('YOUTUBE_API_KEY no está definida en el archivo .env.');

    const searchResults = await yts({ query, key: YOUTUBE_API_KEY });
    if (!searchResults.videos || searchResults.videos.length === 0) throw new Error(`No se encontraron resultados para "${query}".`);
    
    const videoId = searchResults.videos[0].videoId;
    try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YOUTUBE_API_KEY}&part=snippet,contentDetails,statistics`;
        const response = await axios.get(apiUrl);
        const item = response.data.items[0];
        if (!item) throw new Error(`No se encontraron detalles para el video con ID: ${videoId}`);
        
        const { snippet, contentDetails, statistics } = item;

        // =================================================================
        // CORRECCIÓN: Se elimina el límite de duración para permitir la descarga de mixes largos.
        // La validación de peso se hará DESPUÉS de la descarga.
        // =================================================================

        return {
            title: snippet.title, channel: snippet.channelTitle,
            duration: parseDuration(contentDetails.duration),
            thumb: snippet.thumbnails.high.url || searchResults.videos[0].thumbnail,
            url: `https://youtube.com/watch?v=${videoId}`, videoId: videoId,
            views: parseInt(statistics.viewCount || 0, 10),
            likes: parseInt(statistics.likeCount || 0, 10),
            uploadDate: new Date(snippet.publishedAt),
        };
    } catch (apiError) {
        console.error(chalk.red(`[YOUTUBE API ERROR] Falló la obtención de metadatos para ${videoId}:`), apiError.message);
        throw new Error('Hubo un error al contactar la API de YouTube.');
    }
}

function parseDuration(isoDuration) {
    const matches = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!matches) return '00:00';
    const [ , hours = '0', minutes = '0', seconds = '0' ] = matches;
    const pad = (num) => num.padStart(2, '0');
    return hours !== '0' ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

// --- FUNCIÓN PARA DESCARGAR AUDIO (CON MEDICIÓN DE PESO) ---
async function ytMp3(query) {
    try {
        const videoData = await getDetailedVideoData(query);
        const filePath = path.join(tempFolder, `${videoData.videoId}.mp3`);
        
        const execOptions = [ videoData.url, '-f', 'ba', '-x', '--audio-format', 'mp3', '--audio-quality', '5', '-o', filePath, '--no-playlist', ...BROWSER_SIMULATION_OPTIONS ];
        if (fs.existsSync(cookiesPath)) execOptions.push('--cookies', cookiesPath);
        
        await ytDlpWrap.execPromise(execOptions);
        if (!fs.existsSync(filePath)) throw new Error('yt-dlp no pudo descargar el archivo de audio.');
        
        // Medición del peso del archivo DESPUÉS de la descarga
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        return { ...videoData, filePath, fileSizeInMB }; // Devolvemos el peso
    } catch (error) {
        console.error(chalk.red('[MP3 ERROR]'), error);
        throw error;
    }
}

// --- FUNCIÓN PARA DESCARGAR VIDEO (SIN CAMBIOS) ---
async function ytMp4(query) {
    try {
        if (!ffmpegInstalled) throw new Error('FFmpeg no está instalado en el servidor.');

        const videoData = await getDetailedVideoData(query);
        const filePath = path.join(tempFolder, `${videoData.videoId}.mp4`);
        const execOptions = [ videoData.url, '-f', 'best[ext=mp4]/best[ext=webm]/bestvideo+bestaudio', '--recode-video', 'mp4', '-o', filePath, '--no-playlist', ...BROWSER_SIMULATION_OPTIONS ];
        if (fs.existsSync(cookiesPath)) execOptions.push('--cookies', cookiesPath);

        await ytDlpWrap.execPromise(execOptions);
        if (!fs.existsSync(filePath)) throw new Error('yt-dlp no pudo descargar el archivo de video.');
        
        return { ...videoData, filePath };
    } catch (error) {
        console.error(chalk.red('[MP4 ERROR]'), error);
        if (error.message.includes('Sign in') || error.message.includes('confirm you are not a bot')) {
            throw new Error('YouTube requiere autenticación para este video.');
        } else {
            throw new Error('Falló el proceso de descarga de video.');
        }
    }
}

module.exports = {
    isYTUrl,
    ytMp3,
    ytMp4,
    getDetailedVideoData
=======
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
>>>>>>> 4190fc256127568555dde0af794dfc1b0a281b39
};