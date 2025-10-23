// libs/converter.js (VERSIÓN COMMONJS)

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// En CommonJS, __dirname es una variable global que nos da la ruta del directorio actual.

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const tmp = path.join(__dirname, '../tmp/', `${Date.now()}.${ext}`);
            const out = `${tmp}.${ext2}`;
            await fs.promises.writeFile(tmp, buffer);
            
            spawn('ffmpeg', ['-y', '-i', tmp, ...args, out])
                .on('error', reject)
                .on('close', async (code) => {
                    try {
                        await fs.promises.unlink(tmp);
                        if (code !== 0) return reject(new Error(`El proceso de ffmpeg finalizó con el código ${code}`));
                        const data = await fs.promises.readFile(out);
                        await fs.promises.unlink(out);
                        resolve(data);
                    } catch (e) {
                        reject(e);
                    }
                });
        } catch (e) {
            reject(e);
        }
    });
}

function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-ac', '2',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'mp3'
    ], ext, 'mp3');
}

function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10'
    ], ext, 'opus');
}

function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ab', '128k',
        '-ar', '44100',
        '-crf', '32',
        '-preset', 'slow'
    ], ext, 'mp4');
}

// Exportamos las funciones para que puedan ser usadas con require()
module.exports = {
    ffmpeg,
    toAudio,
    toPTT,
    toVideo
};